import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

type RenderData = {
  templateId: number;
  fileType: string;
  secretId: string;
  secretValue: string;
  values: string;
};

export const render = async ({
  templateId,
  fileType,
  secretId,
  secretValue,
  values,
}: RenderData) => {
  const { data } = await api.post("/render", {
    templateId,
    fileType,
    secretId,
    secretValue,
    values,
  });
  return data;
};

type UpdateTemplateData = {
  name: string;
  description: string;
  content: string;
  fields: string;
  templateId: number;
};
export const updateTemplate = async ({
  name,
  description,
  content,
  fields,
  templateId,
}: UpdateTemplateData) => {
  const { data } = await api.put(`/template/${templateId}`, {
    name,
    description,
    content,
    fields,
  });
  return data;
};

type PostTemplateData = {
  name: string;
  description: string;
  content: string;
  fields: string;
  projectId: number;
};
export const saveTemplate = async ({
  name,
  description,
  content,
  fields,
  projectId,
}: PostTemplateData) => {
  const { data } = await api.post("/template", {
    name,
    description,
    content,
    fields,
    projectId,
  });
  return data;
};

export const getUser = async (id: number) => {
  const { data } = await api.get(`/user/${id}`);
  return data;
};
