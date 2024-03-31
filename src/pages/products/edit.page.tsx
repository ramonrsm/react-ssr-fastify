import React from "react";
import { useParams } from "react-router-dom";

export const path = "/products/:id/edit";

export default function EditProduct() {
  const { id } = useParams();

  return <div>Editar Produto id:{id}</div>;
}
