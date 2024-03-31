import React from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

interface IRepository {
  id: number;
  name: string;
}

export const path = "/repositories/:username";

export async function ServerSideProps() {
  const response = await axios.get<IRepository>(
    `https://api.github.com/users/ramonrsm/repos`
  );

  const repositories = response?.data || [];

  return {
    props: {
      repositories,
    },
  };
}

export default function Repositories({
  props,
}: {
  props?: { repositories: IRepository[] };
}) {
  let { username } = useParams();

  return (
    <>
      <h2>Repositórios do GitHub: {username}</h2>
      <ul>
        {props?.repositories?.length ? (
          props?.repositories.map((repository: any) => (
            <li key={repository.id}>{repository.name}</li>
          ))
        ) : (
          <li>Nenhum repositório encontrado</li>
        )}
      </ul>
    </>
  );
}
