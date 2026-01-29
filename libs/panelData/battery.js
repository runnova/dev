
ntx.panel.setHTML(`
    <div id="batterydisdiv" class="navmalobj" style="display:flex;align-items:center;gap:4px;">
      <span class="battery-p-display">...</span>
      <span class="battery-display material-symbols-rounded">battery_unknown</span>
    </div>
    <style>
                @font-face {
                    font-family: 'Material Symbols Rounded';
                    font-style: normal;
                    src: url(https://adthoughtsglobal.github.io/resources/MaterialSymbolsRounded.woff2) format('woff2');
                }
                .material-symbols-rounded {
                    font-family: 'Material Symbols Rounded';
                    font-weight: normal;
                    font-style: normal;
                    font-size: 24px;
                    line-height: 1;
                    display: inline-block;
                    white-space: nowrap;
                    direction: ltr;
                    -webkit-font-smoothing: antialiased;
                }
            </style>
  `);
async function update() {
  const info = await ntx.os.getBattery();
  console.log(info)
  const level = Math.round(info.level * 100);
  const charging = info.charging;
  let icon =
    charging ? "battery_charging_full" :
      level >= 90 ? "battery_full" :
        level >= 75 ? "battery_6_bar" :
          level >= 60 ? "battery_5_bar" :
            level >= 45 ? "battery_4_bar" :
              level >= 30 ? "battery_3_bar" :
                level >= 15 ? "battery_2_bar" :
                  level > 5 ? "battery_1_bar" :
                    "battery_alert";
  ntx.panel.setText("battery-p-display", level + "%");
  ntx.panel.setText("battery-display", icon);
}
update();
setInterval(update, 60000);