import { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "grapesjs-preset-newsletter/dist/grapesjs-preset-newsletter.css";
import "grapesjs-preset-newsletter";
import { saveTemplate, render, getUser, updateTemplate } from "../api";
import { useRouter } from "next/router";

export default function Create() {
  const ref = useRef(null);
  const editor = useRef<grapesjs.Editor | null>(null);
  const router = useRouter();
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

  const [user, setUser] = useState<object | null>(null);

  useEffect(() => {
    setTemplateId(Number(router.query.id));
  }, [router.query.id]);

  useEffect(() => {
    getUser(1).then((user) => {
      setUser(user);
      setSelectedProject(user.projects[0].id);
    });
  }, []);

  useEffect(() => {
    const container = ref.current as unknown as HTMLElement;
    editor.current = grapesjs.init({
      container,
      fromElement: true,
      height: "87%",
      width: "auto",
      plugins: ["gjs-preset-newsletter"],
      storageManager: {
        id: "gjs-",
        type: "local",
        autosave: true,
      },
      deviceManager: false,
    });
  }, []);
  console.log(templateId);
  const onSave = async () => {
    const html = editor.current?.getHtml();
    if (!html) return;
    if (!templateId) {
      const result = await saveTemplate({
        name,
        description,
        content: html,
        fields: "",
        projectId: 1,
      });
      router.push("/create", { query: { ...router.query, id: result.id } });
    } else {
      const result = await updateTemplate({
        name,
        description,
        content: html,
        fields: "",
        templateId,
      });
    }
  };

  const onPDF = async () => {
    if (!templateId) {
      return;
    }
    const project = user?.projects?.find((p) => p.id === selectedProject);
    if (!project) {
      return;
    }
    const secretId = project.secrets[0].id;
    const secretValue = project.secrets[0].value;

    const pdf = await render({
      templateId,
      fileType: "pdf",
      secretId,
      secretValue,
      values: "",
    });
    console.log(pdf);
  };
  console.log(selectedProject);
  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
      }}
    >
      <div>
        <h2>
          <input name="name" />
        </h2>
        <select
          name="projects"
          value={selectedProject}
          onChange={(e) => {
            setSelectedProject(e.target.value);
          }}
        >
          {user?.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button onClick={onSave}>{templateId ? "Update" : "Save"}</button>
        <button onClick={onPDF}>PDF</button>
      </div>
      <div
        ref={ref}
        style={{
          width: "auto",
          height: "auto",
          minHeight: "auto",
        }}
      ></div>
    </div>
  );
}
