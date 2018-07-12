# SkypeBotWW
WebService utilizado en WebWard, permite enviar mensajes a usuarios conociendo previamente su dirección (address) de SKYPE o las plataformas habilitadas.
El código es muy simple y solo posee 3 endpoints.

- "/": para testear que el servidor está corriendo
- "/api/messages" : El webhook que será llamada por Micosoft para recibir mensajes.
- "/webward/messages": El webhook que será llamado por webward para mandar mensajes a los usuarios.

El bot únicamente responde a comandos que contengan la palabra webward, y responderá con la dirección del usuario encriptada y en base64 para ser insertada en el módulo de webward y que este utilizará para mandar mensajes.
