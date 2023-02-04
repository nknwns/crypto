const CONVERTER_URL = 'https://bitpay.com/api/rates';
const CIRCLE_COLORS = [
    "#1deca8", // receiving
    "#ff5f5f;", // sending
    "#f18639", // multi 
];

const updateExchangeRate = async (URL, currencyList) => {
    let response = await fetch(URL);
    if (response.ok) {
        json = await response.json();

        const rateList = document.querySelector('.exchange-rate').children;
        currencyList.forEach((element, index) => {
            const currencyIndex = json.findIndex(el => el.code == element);
            rateList[index].children[0].textContent = json[currencyIndex].name;
            rateList[index].children[1].textContent = 'BTC/' + json[currencyIndex].code;
            rateList[index].children[2].textContent = json[currencyIndex].rate;
        })

        const USD = json[json.findIndex(el => el.code == 'USD')].rate;

        document.querySelectorAll('.btc-to-usd').forEach(el => {
            el.dataset.usd = Number(el.dataset.btc) * USD;
            el.classList.add('tooltip');
        });
    } else {
        console.log('Сервис конвертации временно недоступен..');
    }
}

const convertTransferAmounts = async (URL, currency) => {
    try {
        let json;

        let response = await fetch(URL);
        if (response.ok) {
            json = await response.json();

            const CURRENCY = json[json.findIndex(el => el.code == currency)].rate;

            document.querySelectorAll('.btc-to-usd').forEach(el => {
                el.dataset.usd = Number(el.dataset.btc) * CURRENCY;
                el.classList.add('tooltip');
            });
        } else {
            console.log('Сервис конвертации временно недоступен..');
        }
    } catch {
        console.log('Ошибка запроса..');
    }
}

const selectWallets = () => {
    let wallets = [];

    document.querySelectorAll('.transaction').forEach(el => {
        const walletID = el.children[2].textContent;
        const transactionType = Number(el.children[0].textContent.toLowerCase() == 'sending');

        if (!wallets.some(el => el.id == walletID)) {
            wallets.push({
                id: walletID,
                type: transactionType
            });
        } else {
            const walletIndex = wallets.findIndex(el => el.id == walletID);
            if (wallets[walletIndex].type == !transactionType) wallets[walletIndex].type = 2;
        }
    });

    return wallets;
}

const createChart = () => {
    const currentWalletID = document.querySelector('.badge__content').textContent;
    const wallets = selectWallets();

    am5.ready(function() {
        let root = am5.Root.new("chartdiv");
        
        root.setThemes([
          am5themes_Animated.new(root)
        ]);

        let data = {
            name: "Root",
            value: 0,
            children: [
              {
                name: 'You',
                description: currentWalletID,
                children: wallets.map(el => {
                    return {
                        description: el.id,
                        name: el.id.substr(0, 3) + '..' + el.id.substr(-3),
                        type: el.type
                    }
                })
              }
            ]
        }

        let container = root.container.children.push(
            am5.Container.new(root, {
                width: am5.percent(100),
                height: am5.percent(100),
                layout: root.verticalLayout
            })
        );

        let series = container.children.push(
            am5hierarchy.ForceDirected.new(root, {
                singleBranchOnly: false,
                downDepth: 1,
                topDepth: 1,
                maxRadius: 40,
                minRadius: 10,
                valueField: "value",
                categoryField: "name",
                childDataField: "children",
                idField: "description",
                linkWithStrength: 5,
                linkWithField: "linkWith",
                manyBodyStrength: -15,
                centerStrength: 0.5,
            })
        );
                  
        series.circles.template.adapters.add("fill", function(fill, target) {
            if (target.dataItem.get("depth") == 2) {
                let color = CIRCLE_COLORS[target.dataItem.dataContext.type];
                return am5.color(color);
                
            }
            return am5.color("#323743");
        });
          
        series.data.setAll([data]);
        series.set("selectedDataItem", series.dataItems[0]);

        series.nodes.template.set("tooltipText", "{id}");
        
        series.appear(1000, 100);
    });
}

window.onload = async () => {
    if (localStorage.getItem('dark-mode') === 'true') {
        document.body.classList.add('dark');
        document.querySelector('.switch').checked = true;
    }
    
    if (document.querySelector('.exchange-rate')) updateExchangeRate(CONVERTER_URL, ['USD', 'EUR', 'BYN', 'RUB']);
    if (document.querySelector('.btc-to-usd')) convertTransferAmounts(CONVERTER_URL, 'USD');
    if (document.querySelector('#chartdiv')) createChart();
};

document.querySelector('.switch').addEventListener('input', evt => document.body.classList.toggle('dark'));
window.onunload = () => localStorage.setItem('dark-mode', document.body.classList.contains('dark'));