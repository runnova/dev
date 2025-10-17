ntxPanel.greenflag = async function() {
  await ntx.sysUI.toast("hi");
  ntx.panel.setHTML(``);
}
ntxPanel.onPanelClick = function() {
  ntx.sysUI.toast("damn");
}
ntxPanel.getInfo = function() {
  return {
    "name":"hi app"
  };
}