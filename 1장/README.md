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

## play 변수 제거하기

aPerformance는 루프 변수에서 오기 때문에 반복문을 한 번 돌 때마다 자연스레 값이 바뀐다.

하지만 play는 `개별 공연(aPerformance)에서 얻기 때문에 애초에 매개변수로 전달할 필요가 없다.` 그냥 amountFor() 안에서 다시 계산하면 된다

이런 임시변수들 때문에 로컬 범위에 존재하는 이름이 늘어나서 추출 작업이 복잡해진다. 이를 해결하는 리팩터링으로 `임시 변수를 질의 함수로 바꾸기`가 있다.

먼저 대입문의 우변을 함수로 추출한다

```javascript
// statement() 함수
function playFor(aPerformance) {
    return plays[aPerformance.playID];
}

// 최상위
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
        const play = playFor(perf); // <- 우변을 함수로 추출
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
```

컴파일-테스트-커밋한 다음 `변수 인라인하기`를 적용한다

```javascript
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
        // const play = playFor(perf)  // 인라인된 변수 제거
        let thisAmount = amountFor(perf, play);
        // 포인트를 적립한다.
        volumeCredits += Math.max(perf.audience - 30, 0);
        // 희극 관객 5명마다 추가 포인트를 제공한다.
        if ("comedy" === playFor(perf).type)
            volumeCredits += Math.floor(perf.audience / 5);

        // 청구 내역을 출력한다.
        result += `${playFor(perf).name}: ${format(thisAmount / 100)} (${
            perf.audience
        }석)\n`;
        totalAmount += thisAmount;
    }
    result += `총액: ${format(totalAmount / 100)}\n`;
    result += `적립 포인트: ${volumeCredits}점\n`;
    return result;
}
```

변수를 인라인해서 amountFor()에 `함수 선언 바꾸기`를 적용해서 play 매개변수를 제거할 수 있게 됐다. 이 작업은 2단계로 진행한다.

먼저 새로 만든 playFor()를 쓰도록 amountFor()를 수정한다

```javascript
function amountFor(aPerformance, play) {
    let result = 0;
    switch (
        playFor(aPerformance).type // <- play를 playFor()로 변경
    ) {
        case "tragedy":
            result = 40_000;
            if (aPerformance.audience > 30) {
                result += 1_000 * (aPerformance.audience - 30);
            }
            break;

        case "comedy":
            result = 30_000;
            if (aPerformance.audience > 20) {
                result += 10_000 + 500 * (aPerformance.audience - 20);
            }
            result += 300 * aPerformance.audience;
            break;

        default:
            // play를 playFor()로 변경
            throw new Error(`알 수 없는 장르 : ${playFor(aPerformance).type}`);
    }

    return result;
}
```

컴파일-테스트-커밋하고 play 매개변수를 삭제한다

```javascript
// 최상위
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
        let thisAmount = amountFor(perf); // 필요없는 play 매개변수 제거
        // 포인트를 적립한다.
        volumeCredits += Math.max(perf.audience - 30, 0);
        // 희극 관객 5명마다 추가 포인트를 제공한다.
        if ("comedy" === playFor(perf).type)
            volumeCredits += Math.floor(perf.audience / 5);

        // 청구 내역을 출력한다.
        result += `${playFor(perf).name}: ${format(thisAmount / 100)} (${
            perf.audience
        }석)\n`;
        totalAmount += thisAmount;
    }
    result += `총액: ${format(totalAmount / 100)}\n`;
    result += `적립 포인트: ${volumeCredits}점\n`;
    return result;
}

// statement() 함수 내부
function amountFor(aPerformance) {
    let result = 0;
    switch (playFor(aPerformance).type) {
        case "tragedy":
            result = 40_000;
            if (aPerformance.audience > 30) {
                result += 1_000 * (aPerformance.audience - 30);
            }
            break;

        case "comedy":
            result = 30_000;
            if (aPerformance.audience > 20) {
                result += 10_000 + 500 * (aPerformance.audience - 20);
            }
            result += 300 * aPerformance.audience;
            break;

        default:
            throw new Error(`알 수 없는 장르 : ${playFor(aPerformance).type}`);
    }

    return result;
}
```

방금 리팩토링에서 주목할 것은, 이전 코드는 루프를 한 번 돌 때마다 공연을 조회했는데 리팩터링한 코드에선 3번 조회한다

일단 지금은 이렇게 바꿔도 성능에 큰 영향은 없다. 심각하게 느려지더라도 제대로 리팩터링된 코드베이스는 그렇지 않은 코드보다 성능 개선하기가 훨씬 수월하다

지역변수를 제거해서 얻는 가장 큰 장점은 `추출 작업이 훨씬 쉬워진다`는 것이다. 유효범위를 신경 써야 할 대상이 줄어들기 때문이다. 실제로 저자는 추출 작업 전 거의 항상 지역변수부터 제거한다

amountFor()에 전달할 인수를 모두 처리했으니 이 함수를 호출하는 코드로 돌아간다. 여기서 amountFor()는 임시 변수인 thisAmount에 값을 설정할 때 쓰이는데, 그 값이 다시 바뀌진 않는다. 따라서 `변수 인라인하기`를 적용한다

```javascript
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
        // 포인트를 적립한다.
        volumeCredits += Math.max(perf.audience - 30, 0);
        // 희극 관객 5명마다 추가 포인트를 제공한다.
        if ("comedy" === playFor(perf).type)
            volumeCredits += Math.floor(perf.audience / 5);

        // 청구 내역을 출력한다.
        result += `${playFor(perf).name}: ${format(amountFor(perf) / 100)} (${perf.audience}석)\n`; // thisAmount 변수 인라인
        totalAmount += amountFor(perf); // thisAmount 변수 인라인
    }
    result += `총액: ${format(totalAmount / 100)}\n`;
    result += `적립 포인트: ${volumeCredits}점\n`;
    return result;
```

## 적립 포인트 계산 코드 추출하기

지금까지 statement()를 리팩터링한 결과는 아래와 같다.

```javascript
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
        // 포인트를 적립한다.
        volumeCredits += Math.max(perf.audience - 30, 0);
        // 희극 관객 5명마다 추가 포인트를 제공한다.
        if ("comedy" === playFor(perf).type)
            volumeCredits += Math.floor(perf.audience / 5);

        // 청구 내역을 출력한다.
        result += `${playFor(perf).name}: ${format(amountFor(perf) / 100)} (${
            perf.audience
        }석)\n`;
        totalAmount += amountFor(perf);
    }
    result += `총액: ${format(totalAmount / 100)}\n`;
    result += `적립 포인트: ${volumeCredits}점\n`;
    return result;
}
```

앞에서 play 변수를 제거한 결과 로컬 유효범위의 변수가 하나 줄어서 적립 포인트 계산 부분을 추출하기가 쉬워졌다. 처리할 변수가 아직 2개 더 있다.

여기서도 perf는 전달만 하면 된다. 하지만 volumeCredits는 반복문을 돌 때마다 값을 누적해야 하기 때문에 까다롭다.

최선의 방법은 추출한 함수에서 volumeCredits 복제본을 초기화하고 계산 결과를 반환하게 하는 것이다.

```javascript
// statement() 함수
function volumeCreditsFor(perf) {
    let volumeCredits = 0;
    volumeCredits += Math.max(perf.audience - 30, 0);
    if ("comedy" === playFor(perf).type) {
        volumeCredits += Math.floor(perf.audience / 5);
    }

    return volumeCredits;
}

// 최상위
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
        // 포인트를 적립한다.
        volumeCredits += volumeCreditsFor(perf); // 추출한 함수를 써서 값을 누적

        // 청구 내역을 출력한다.
        result += `${playFor(perf).name}: ${format(amountFor(perf) / 100)} (${
            perf.audience
        }석)\n`;
        totalAmount += amountFor(perf);
    }
    result += `총액: ${format(totalAmount / 100)}\n`;
    result += `적립 포인트: ${volumeCredits}점\n`;
    return result;
}
```

컴파일-테스트-커밋하고 새로 추출한 함수에서 쓰이는 변수명을 적절하게 바꾼다

```javascript
function volumeCreditsFor(aPerformance) {
    let result = 0;
    result += Math.max(aPerformance.audience - 30, 0);
    if ("comedy" === playFor(aPerformance).type) {
        result += Math.floor(aPerformance.audience / 5);
    }

    return result;
}
```

책에선 한 단계처럼 표현했지만 실제론 변수명을 하나씩 바꿀 때마다 컴파일-테스트-커밋한다

## format 변수 제거하기

다시 최상위 코드인 statement()를 확인한다

```javascript
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
        volumeCredits += volumeCreditsFor(perf);

        // 청구 내역을 출력한다.
        result += `${playFor(perf).name}: ${format(amountFor(perf) / 100)} (${
            perf.audience
        }석)\n`;
        totalAmount += amountFor(perf);
    }
    result += `총액: ${format(totalAmount / 100)}\n`;
    result += `적립 포인트: ${volumeCredits}점\n`;
    return result;
}
```

앞에서 설명했듯 임시 변수는 나중에 문제를 일으킬 수 있다. 임시변수는 자신이 속한 루틴에서만 의미가 있어서 루틴이 길고 복잡해지기 쉽다.

따라서 다음으로 할 리팩터링은 이런 변수들을 제거하는 것이다. 그 중에서 format이 가장 만만해 보인다. format은 임시 변수에 함수를 대입한 형태인데 저자는 함수를 직접 선언해 쓰도록 바꾸는 편이다.

```javascript
// statement() 함수
function format(aNumber) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(aNumber);
}

// 최상위
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
        volumeCredits += volumeCreditsFor(perf);

        // 청구 내역을 출력한다.
        result += `${playFor(perf).name}: ${format(amountFor(perf) / 100)} (${
            perf.audience
        }석)\n`; // 임시 변수였던 format을 함수 호출로 대체
        totalAmount += amountFor(perf);
    }
    result += `총액: ${format(totalAmount / 100)}\n`; // 임시 변수였던 format을 함수 호출로 대체
    result += `적립 포인트: ${volumeCredits}점\n`;
    return result;
}
```

> 이렇게 함수 변수를 일반 함수로 바꾸는 것도 리팩터링이지만 따로 이름을 붙여서 리팩터링 목록에 넣지는 않았다.  
> 굉장히 간단하고 드물게 쓰여서 그리 중요하지 않다고 판단했기 때문이다. 이렇게 따로 구분할 만큼 중요해 보이지 않는 리팩터링 기법은 이외에도 많이 있다
