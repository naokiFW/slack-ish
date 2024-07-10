const messageInput = document.getElementById("message-input");

setInterval(() => {
  if (messageInput.value === "") {
    window.location.reload();
  }
}, 5 * 1000);

function change_msg(msg_id) {

  var form = document.createElement('form');
  var request = document.createElement('input');

  form.method = 'POST';
  form.action = '/change_msg';

  request.type = 'hidden'; //入力フォームが表示されないように
  request.name = 'msg_id';
  request.value = msg_id;

  form.appendChild(request);
  document.body.appendChild(form);

  form.submit();

}