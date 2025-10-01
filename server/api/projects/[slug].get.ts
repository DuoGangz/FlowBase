import { getFirestore } from '~~/server/utils/firestore'

export default defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event)
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })
  }
  const db = getFirestore()
  const projSnap = await db.collection('projects').where('slug', '==', slug).limit(1).get()
  if (projSnap.empty) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  const project: any = projSnap.docs[0].data()
  // Enrich with relations for parity
  const messagesSnap = await db.collection('messages').where('projectId', '==', project.id).orderBy('createdAt', 'desc').get()
  const todosSnap = await db.collection('todos').where('projectId', '==', project.id).get()
  const filesSnap = await db.collection('files').where('projectId', '==', project.id).orderBy('createdAt', 'desc').get()
  const todos = todosSnap.docs.map(d => d.data())
  for (const t of todos as any[]) {
    const itemsSnap = await db.collection('todoItems').where('todoId', '==', t.id).get()
    const items = itemsSnap.docs.map(d => d.data())
    for (const it of items as any[]) {
      const subsSnap = await db.collection('todoSubItems').where('todoItemId', '==', it.id).get()
      it.subItems = subsSnap.docs.map(d => d.data())
    }
    t.items = items
  }
  return { ...project, messages: messagesSnap.docs.map(d => d.data()), todos, files: filesSnap.docs.map(d => d.data()) }
})


