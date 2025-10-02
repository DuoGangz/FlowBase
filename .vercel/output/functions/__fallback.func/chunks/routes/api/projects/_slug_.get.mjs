import { d as defineEventHandler, e as getRouterParams, c as createError } from '../../../nitro/nitro.mjs';
import { g as getFirestore } from '../../../_/firestore.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'firebase-admin';

const _slug__get = defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event);
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "slug is required" });
  }
  const db = getFirestore();
  const projSnap = await db.collection("projects").where("slug", "==", slug).limit(1).get();
  if (projSnap.empty) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" });
  }
  const project = projSnap.docs[0].data();
  const messagesSnap = await db.collection("messages").where("projectId", "==", project.id).orderBy("createdAt", "desc").get();
  const todosSnap = await db.collection("todos").where("projectId", "==", project.id).get();
  const filesSnap = await db.collection("files").where("projectId", "==", project.id).orderBy("createdAt", "desc").get();
  const todos = todosSnap.docs.map((d) => d.data());
  for (const t of todos) {
    const itemsSnap = await db.collection("todoItems").where("todoId", "==", t.id).get();
    const items = itemsSnap.docs.map((d) => d.data());
    for (const it of items) {
      const subsSnap = await db.collection("todoSubItems").where("todoItemId", "==", it.id).get();
      it.subItems = subsSnap.docs.map((d) => d.data());
    }
    t.items = items;
  }
  return { ...project, messages: messagesSnap.docs.map((d) => d.data()), todos, files: filesSnap.docs.map((d) => d.data()) };
});

export { _slug__get as default };
//# sourceMappingURL=_slug_.get.mjs.map
