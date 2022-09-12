import INVOICE from "./invoices.json" assert { type: "json" };
import PLAYS from "./plays.json" assert { type: "json" };

function statement(invoice, plays) {
    let totalAmount = 0;
    let volumeCredits = 0;
    let result = `청구 내역(고객명: ${invoice.customer})\n`;
    const format = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format;

    for (let perf of invoice.performances) {
        const play = plays[perf.playID];
        let thisAmount = amountFor(perf, play);
        // 포인트를 적립한다.
        volumeCredits += Math.max(perf.audience - 30, 0);
        // 희극 관객 5명마다 추가 포인트를 제공한다.
        if ("comedy" === play.type)
            volumeCredits += Math.floor(perf.audience / 5);

        // 청구 내역을 출력한다.
        result += `${play.name}: ${format(thisAmount / 100)} (${
            perf.audience
        }석)\n`;
        totalAmount += thisAmount;
    }
    result += `총액: ${format(totalAmount / 100)}\n`;
    result += `적립 포인트: ${volumeCredits}점\n`;
    return result;
}

console.log(statement(INVOICE[0], PLAYS));

// 공연 한 번의 요금을 계산하는 함수
function amountFor(aPerformance, play) {
    let result = 0;
    switch (play.type) {
        case "tragedy": // 비극
            result = 40_000;
            if (aPerformance.audience > 30) {
                result += 1_000 * (aPerformance.audience - 30);
            }
            break;

        case "comedy": // 희극
            result = 30_000;
            if (aPerformance.audience > 20) {
                result += 10_000 + 500 * (aPerformance.audience - 20);
            }
            result += 300 * aPerformance.audience;
            break;

        default:
            throw new Error(`알 수 없는 장르 : ${play.type}`);
    }

    return result;
}
