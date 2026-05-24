export async function authenticate(request, reply) {
    try {
        await request.jwtVerify()
        request.user = request.user  // ensure it's explicitly available downstream
    } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized — please log in' })
    }
}