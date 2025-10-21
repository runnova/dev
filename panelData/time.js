
greenflag = function () {
  ntx.panel.setHTML(`<div class="hello"><span class="time-display">...</span>
								<span class="date-display"></span></div><style>.hello{align-items:center;justify-content:center;font-size:14px;margin: 0 10px; display:flex;flex-direction:column; font-family:monospace;}</style>`);
  async function update() {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = now.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });
    ntx.panel.setText("time-display", time);
    ntx.panel.setText("date-display", date);

  }
  setInterval(update, 1770);
};
greenflag();