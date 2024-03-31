import fastifyStatic from "@fastify/static";
import fastGlob from "fast-glob";
import fastify from "fastify";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { Route, Routes } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";

const app = fastify();

app.register(fastifyStatic, {
  root: path.join(process.cwd(), "public"),
  prefix: "/public",
});

const filePathRoutes = fastGlob.sync("src/pages/**/*.page.tsx");

const pathRoutes = filePathRoutes.map((path) => {
  return path.replace("src/", "").replace(".tsx", "");
});

type Page<T = unknown> = {
  path: string;
  default: React.ComponentType<{ props: T }>;
  ServerSideProps?: () => Promise<{ props: T }>;
};

const mapRoutes = new Map<string, Page>();

app.get("*", async (request, reply) => {
  
  for await (const pathRoute of pathRoutes) {
    const page: Page = await import(`./${pathRoute}`);

    const pageKeys = Object.keys(page);

    if (!pageKeys.includes("path") || !pageKeys.includes("default")) continue;

    const routeExists = mapRoutes.get(page.path);

    if (routeExists) continue;

    mapRoutes.set(page.path, {
      default: page.default,
      path: page.path,
      ServerSideProps: page.ServerSideProps,
    });
  }

  const routes: React.ReactNode[] = [];

  const pages = Array.from(mapRoutes.values());

  for (const page of pages) {
    const data = page.ServerSideProps ? await page.ServerSideProps() : null;

    const pageElement = React.createElement(page.default, {
      props: data?.props,
    });

    const routeElement = React.createElement(Route, {
      path: page.path,
      element: pageElement,
    });

    routes.push(routeElement);
  }

  const notFoundElement = React.createElement(Route, {
    path: "*",
    element: React.createElement("h1", {}, "Página não encontrada"),
  });

  const routesElement = React.createElement(
    Routes,
    {},
    ...routes,
    notFoundElement
  );

  const staticRouterElement = React.createElement(
    StaticRouter,
    {
      location: request.url,
    },
    routesElement
  );

  const html = renderToString(staticRouterElement);

  reply.header("Content-Type", "text/html");

  return reply.send(
    `<!DOCTYPE html>
      <html lang="pt-br">
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" href="/public/favicon.png" />
      <title>DevMoura Tech Solution</title>
      <meta
        name="description"
        content="Combinamos expertise e inovação para impulsionar a alta performance do seu time ou projeto de software."
      />
      <body>${html}</body>
      </html>`
  );
});

app.listen(
  {
    port: 3000,
  },
  (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log("Servidor iniciado em http://localhost:3000");
  }
);
