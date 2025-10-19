ntxPanel.greenflag = async function() {
  await ntx.sysUI.toast("hi");
  ntx.panel.setHTML(`<div class="hello">hi lol</div>`);
  ntx.panel.setText("hello", Date.now());
}