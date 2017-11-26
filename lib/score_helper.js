
function isCheckoutAttempt(dart, currentScore) {
    return currentScore == 50 || (currentScore <= 40 && currentScore % 2 == 0);
}

function isCheckout(dart, currentScore) {
    return currentScore - (dart.score * dart.multiplier) === 0 && dart.multiplier === 2;
}

function isBust(dart, currentScore) {
    dart.score = dart.score === null ? 0 : dart.score;
    var scoreAfterThrow = currentScore - (dart.score * dart.multiplier);

    if (isCheckout(dart, currentScore)) {
        return false
    }
    else if (scoreAfterThrow < 2) {
        return true;
    }
    return false;
}
module.exports = {
    setVisitModifiers: (currentScore, firstDart, secondDart, thirdDart) => {
        firstDart.is_bust = isBust(firstDart, currentScore);
        if (!firstDart.is_bust) {
            firstDart.is_checkout_attempt = isCheckoutAttempt(firstDart, currentScore);
            firstDart.is_checkout = isCheckout(firstDart, currentScore);
        }
        currentScore = currentScore - (firstDart.score * firstDart.multiplier);

        if (!firstDart.is_bust && !firstDart.is_checkout) {
            secondDart.is_bust = isBust(secondDart, currentScore);
            if (!secondDart.is_bust) {
                secondDart.is_checkout_attempt = isCheckoutAttempt(secondDart, currentScore);
                secondDart.is_checkout = isCheckout(secondDart, currentScore);
            }
            currentScore = currentScore - (secondDart.score * secondDart.multiplier);

            if (!secondDart.is_bust && !secondDart.is_checkout) {
                thirdDart.is_bust = isBust(thirdDart, currentScore);
                if (!thirdDart.is_bust) {
                    thirdDart.is_checkout_attempt = isCheckoutAttempt(thirdDart, currentScore);
                    thirdDart.is_checkout = isCheckout(thirdDart, currentScore);
                }
                currentScore = currentScore - (thirdDart.score * thirdDart.multiplier);
            }
        }
    }
};

