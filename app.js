// app.js (Modificado)
document.addEventListener('DOMContentLoaded', async () => {
  try {
      // 1. Verifica que la librería esté cargada
      if (typeof KushkiCheckout === 'undefined') {
          throw new Error('No se cargó la librería Kushki. Verifica tu conexión a internet.');
      }

      // 2. Configuración inicial
      const paymentResult = document.getElementById('payment-result');
      paymentResult.innerHTML = 'Inicializando pasarela de pago...';

      // 3. Inicializa Kushki
      const kushki = new KushkiCheckout({
          publicMerchantId: 'a090a070ee794a8e8f6992be632631ab',
          isTestEnvironment: true,
          currency: 'COP'
      });

      // 4. Carga el formulario
      paymentResult.innerHTML = 'Cargando formulario...';
      const formAmount = 17.90; // El monto del formulario
      await kushki.form({
          formId: 'WsL9kP-vQ',
          container: 'kajita-container',
          amount: formAmount
      });

      // 5. Maneja el botón de pago
      document.getElementById('pay-button').addEventListener('click', async () => {
          try {
              paymentResult.innerHTML = 'Procesando pago...';

              const token = await kushki.requestToken();
              console.log('Token generado:', token);

              const response = await fetch('/api/charge', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      token: token.token,
                      amount: formAmount // Usamos el monto del formulario
                  })
              });

              const result = await response.json();
              if (response.ok) { // Verifica si la respuesta HTTP es exitosa (2xx)
                  paymentResult.innerHTML = result.success
                      ? `✅ Pago exitoso! Ticket: ${result.ticket}`
                      : `❌ Error: ${result.error}`;
              } else {
                  paymentResult.innerHTML = `❌ Error en el pago (HTTP ${response.status}): ${result.error || 'Error desconocido'}`;
                  console.error(`Error en el pago (HTTP ${response.status}):`, result.error || 'Error desconocido');
              }

          } catch (error) {
              paymentResult.innerHTML = `Error en el pago: ${error.message}`;
              console.error('Error:', error);
          }
      });

  } catch (error) {
      document.getElementById('payment-result').innerHTML =
          `Error inicial: ${error.message}`;
      console.error('Error de inicialización:', error);
  }
});