let cart = [];
let total = 0;

function addItem() {
  const barcode = document.getElementById('barcode').value;
  if (!barcode) return;

  fetch(`/api/barcode/${barcode}`)
    .then(res => res.json())
    .then(data => {
      if (!data) return alert('Medicine not found');

      const price = data.batches[0].sellPrice;
      cart.push({ name: data.name, price });

      total += price;
      render();
      document.getElementById('barcode').value = '';
    });
}

function render() {
  const tbody = document.getElementById('cart');
  tbody.innerHTML = '';

  cart.forEach(i => {
    tbody.innerHTML += `
      <tr>
        <td>${i.name}</td>
        <td>1</td>
        <td>${i.price}</td>
        <td>${i.price}</td>
      </tr>`;
  });

  document.getElementById('total').innerText = total;
}

function checkout() {
  alert('Invoice created!');
}