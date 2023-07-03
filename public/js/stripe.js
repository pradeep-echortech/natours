/*eslint-disable*/
window.onload = ()=>{
  const stripe = Stripe(
    'pk_test_51NOzobSG1Him0PsmCR6ptGamoBTpBgKZUolFTvpVooVo1WBm4gNLKBAxFFRYnK9vbTxe9Zvj2wHg4zellEq13Q0U00lKe12xvV'
  );
  
  const bookTour = async (tourId) => {
    try {
      // Get checkout session from API
      const res = await fetch(
        `http://localhost:5000/api/v1/bookings/checkout-session/${tourId}`
      );
      const session = await res.json()
  
      // Create checkout form + change credit card
      await stripe.redirectToCheckout({
        sessionId: session.session.id,
      });
    } catch (err) {
      console.log(err);
      alert(err);
    }
  };
  
  const bookBtn = document.getElementById('book-tour');
  if (bookBtn) {
    bookBtn.addEventListener('click', (e) => {
      e.target.textContent = 'Processing...';
      const { tourId } = e.target.dataset;
      bookTour(tourId);
    });
  }
  
}