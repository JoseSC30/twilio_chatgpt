const OpenAI = require('openai');

const configuration = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION_ID,
});

let messageHistory = []; // variable para almacenar el historial de mensajes

export default async function handler(req, res) {
    const MessagingResponse = require('twilio').twiml.MessagingResponse;
    var messageResponse = new MessagingResponse();

    const sentMessage = req.body.Body || '';
    let replyToBeSent = "";
    if (sentMessage.trim().length === 0) {
        replyToBeSent = "We could not get your message. Please try again";
    } else {
        try {

            // verificar si messageHistory está vacío
            if (messageHistory.length === 0) {
                // agregar un mensaje inicial para establecer el contexto de la conversación
                messageHistory.push({ role: 'assistant', content: 'Hola' });
            } else {
                // agregar el último mensaje enviado por el usuario al historial de mensajes
                messageHistory.push({ role: 'user', content: req.body.Body });
            }

            const completion = await configuration.chat.completions.create({
                model: "gpt-3.5-turbo",
                // messages: [
                //     { role: 'user', content: req.body.Body }
                // ],
                messages: messageHistory, // pasar el historial de mensajes completo
            });

            replyToBeSent = completion.choices[0].message.content

            // agregar la respuesta generada al historial de mensajes
            messageHistory.push({ role: 'assistant', content: replyToBeSent });

        } catch (error) {
            if (error.response) {
                console.log(error.response)
                replyToBeSent = "There was an issue with the server"
            } else { // error getting response
                replyToBeSent = "An error occurred during your request.";
            }
        }
    }
    messageResponse.message(replyToBeSent);
    // send response
    res.writeHead(200, {
        'Content-Type': 'text/xml'
    });
    res.end(messageResponse.toString());
}