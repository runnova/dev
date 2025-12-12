greenflag = function () {
  ntx.panel.setHTML(`<div class="hello"><span class="time-display">...</span>
								<span class="date-display"style="font-size:11px;"></span></div>
                <style>
                .hello{
                align-items:center;
                justify-content:center; 
                display:flex;
                font-size:13px;
                padding: 0 5px;
                flex-direction:column;
                }
                </style>`);
  async function update() {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });
    ntx.panel.setText("time-display", time);
    ntx.panel.setText("date-display", date);

  }
  setInterval(update, 1770);
};
greenflag();