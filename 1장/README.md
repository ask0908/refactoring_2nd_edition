### plays.json

```json
{
    "hamlet": { "name": "Hamlet", "type": "tragedy" },
    "as-like": { "name": "As You Like It", "type": "comedy" },
    "othello": { "name": "Othello", "type": "tragedy" }
}
```

### invoices.json

```json
[
    {
        "customer": "BigCo",
        "performances": [
            {
                "playID": "hamlet",
                "audience": 55
            },
            {
                "playID": "as-like",
                "audience": 35
            },
            {
                "playID": "othello",
                "audience": 40
            }
        ]
    }
]
```

리팩터링의 첫 단계 : 테스트 코드부터 마련하기

테스트 = 실수로부터 보호해주는 버그 검출기

테스트를 신경 써서 만들면 디버깅 시간이 줄어 전체 작업 시간은 단축된다

---

## statement() 쪼개기

긴 함수를 리팩터링할 때는 전체 동작을 각각의 부분으로 나눌 수 있는 지점을 찾는다

switch문은 공연 한 번에 대한 요금을 계산한다. 이것은 코드를 분석해서 얻은 정보다

추출한 함수에는 그 코드가 하는 일을 설명하는 이름을 짓는다

먼저 별도 함수로 빼냈을 때 유효범위를 벗어나는 변수(새 함수에선 곧바로 사용할 수 없는 변수)가 있는지 확인한다 -> perf, play, thisAmount가 해당함

perf, play는 추출한 새 함수에서도 필요하지만 값을 바꾸지 않기 때문에 매개변수로 전달한다

thisAmount는 함수 안에서 값이 바뀌는데 이 예시에선 이런 변수가 하나뿐이라서 이 값을 반환하게 작성한다. 또한 이 변수를 초기화하는 코드도 추출한 함수에 넣는다

```javascript
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
function amountFor(perf, play) {
    let thisAmount = 0;
    switch (play.type) {
        case "tragedy": // 비극
            thisAmount = 40_000;
            if (perf.audience > 30) {
                thisAmount += 1_000 * (perf.audience - 30);
            }
            break;

        case "comedy": // 희극
            thisAmount = 30_000;
            if (perf.audience > 20) {
                thisAmount += 10_000 + 500 * (perf.audience - 20);
            }
            thisAmount += 300 * perf.audience;
            break;

        default:
            throw new Error(`알 수 없는 장르 : ${play.type}`);
    }

    return thisAmount;
}
```

statement()에선 thisAmount 값을 채울 때 추출한 amountFor()를 호출한다

이렇게 수정한 후 곧바로 컴파일, 테스트해서 실수한 게 없는지 확인한다

간단한 수정이라도 리팩터링 후에는 항상 테스트하는 습관을 들이는 게 바람직하다. 사람은 실수하기 마련이다

> 리팩터링은 프로그램 수정을 작은 단계로 나눠 진행한다. 그래서 중간에 실수하더라도 버그를 쉽게 찾을 수 있다

테스트 후 문제가 없다면 변경 사항을 커밋한다

함수를 추출하고 나면 추출된 함수 코드를 보면서 지금보다 명확하게 표현할 수 있는 방법은 없는지 검토한다

먼저 변수명을 더 명확하게 바꾼다

```javascript
// 공연 한 번의 요금을 계산하는 함수
function amountFor(perf, play) {
    let result = 0; // thisAmount -> result 변경
    switch (play.type) {
        case "tragedy": // 비극
            result = 40_000;
            if (perf.audience > 30) {
                result += 1_000 * (perf.audience - 30);
            }
            break;

        case "comedy": // 희극
            result = 30_000;
            if (perf.audience > 20) {
                result += 10_000 + 500 * (perf.audience - 20);
            }
            result += 300 * perf.audience;
            break;

        default:
            throw new Error(`알 수 없는 장르 : ${play.type}`);
    }

    return result;
}
```

변수명 하나를 바꾸더라도 컴파일, 테스트, 커밋한다. 그 후 다음 변수명을 바꾼다

```javascript
// 공연 한 번의 요금을 계산하는 함수
function amountFor(aPerformance, play) {
    // perf -> aPerformance
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
```

필자는 매개변수의 역할이 뚜렷하지 않을 때는 부정관사(a, an)를 붙인다

> 컴퓨터가 이해하는 코드는 바보도 작성할 수 있다. 사람이 이해하도록 작성하는 프로그래머가 진정한 실력자다

좋은 코드라면 하는 일이 명확히 드러나야 하고 이 때 변수명은 큰 역할을 한다. 그러니 명확성을 높이기 위한 이름 바꾸기에는 조금도 망설이지 마라
