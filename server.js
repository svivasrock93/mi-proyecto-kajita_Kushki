// server.js (Modificado)
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración de Kushki
const KUSHKI_CONFIG = {
    privateMerchantId: process.env.KUSHKI_PRIVATE_KEY,
    baseUrl: process.env.MODE === "UAT"
        ? 'https://api-uat.kushkipagos.com'
        : 'https://api.kushkipagos.com'
};

// Log de la clave privada
console.log("KUSHKI_PRIVATE_KEY:", process.env.KUSHKI_PRIVATE_KEY);
console.log("KUSHKI_CONFIG.privateMerchantId:", KUSHKI_CONFIG.privateMerchantId);
console.log("KUSHKI_CONFIG.baseUrl:", KUSHKI_CONFIG.baseUrl);


// Endpoint para procesar pagos
app.post('/api/charge', async (req, res) => {
    try {
        const { token, amount } = req.body;

        console.log("Datos recibidos en /api/charge:", { token, amount });

        // Log de los encabezados
        console.log("Headers:", {
            'Private-Merchant-Id': KUSHKI_CONFIG.privateMerchantId,
            'Content-Type': 'application/json'
        });

        const chargeResponse = await axios.post(
            `${KUSHKI_CONFIG.baseUrl}/card/v1/charges`,
            {
                token,
                amount: {
                    subtotalIva: amount * 0.81,
                    subtotalIva0: 0,
                    iva: amount * 0.19,
                    ice: 0,
                    currency: 'COP'
                }
            },
            {
                headers: {
                    'Private-Merchant-Id': KUSHKI_CONFIG.privateMerchantId,
                    'Content-Type': 'application/json'
                }
            }
        );

        const chargeData = chargeResponse.data;

        console.log("Respuesta de Kushki:", chargeData);

        res.json({
            success: true,
            ticket: chargeData.ticketNumber,
            url: `${KUSHKI_CONFIG.baseUrl.replace('api', 'console')}/transactions/${chargeData.ticketNumber}`
        });
    } catch (error) {
        console.error('Error en /api/charge:', error.response ? error.response.data : error.message);
        res.status(500).json({
            error: error.response ? error.response.data : error.message
        });
    }
});

// Endpoint adicional para anulaciones (opcional)
app.post('/api/void', async (req, res) => {
    try {
        const { ticketNumber } = req.body;

        // Log de los encabezados
        console.log("Headers:", {
            'Private-Merchant-Id': KUSHKI_CONFIG.privateMerchantId,
            'Content-Type': 'application/json'
        });

        const voidResponse = await axios.post(
            `${KUSHKI_CONFIG.baseUrl}/v1/voids`,
            {
                ticketNumber,
                reason: "Customer request"
            },
            {
                headers: {
                    'Private-Merchant-Id': KUSHKI_CONFIG.privateMerchantId,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json(voidResponse.data);
    } catch (error) {
        console.error('Error en /api/void:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : error.message });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Servidor activo en http://localhost:${process.env.PORT}`);
});