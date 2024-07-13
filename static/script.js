const messageInput = document.getElementById("message-input");

setInterval(() => {
  if (messageInput.value === "") {
    window.location.reload();
  }
}, 5 * 1000);


function change_ch(ch_id) {
  var form = document.createElement('form');
  var request = document.createElement('input');

  form.method = 'POST';
  form.action = '/change_ch';

  request.type = 'hidden'; //入力フォームが表示されないように
  request.name = 'ch_id';
  request.value = ch_id;

  form.appendChild(request);
  document.body.appendChild(form);

  form.submit();
}

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

function open_stamps(msg_id, thr_id) {
  var form = document.createElement('form');
  var request_msg = document.createElement('input');
  var request_thr = document.createElement('input');

  form.method = 'POST';
  form.action = '/open_stamp_box';

  request_msg.type = 'hidden'; //入力フォームが表示されないように
  request_msg.name = 'msg_id';
  request_msg.value = msg_id;

  request_thr.type = 'hidden';
  request_thr.name = 'thr_id'
  request_thr.value = thr_id;

  form.appendChild(request_msg);
  form.appendChild(request_thr)
  document.body.appendChild(form);

  form.submit();
}

function close_stamps() {
  var form = document.createElement('form');

  form.method = 'GET';
  form.action = '/close_stamp_box';
  document.body.appendChild(form);

  form.submit();
}