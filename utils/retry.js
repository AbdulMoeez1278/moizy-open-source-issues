async function retry(fn, options = {}) {
    if (typeof fn !== "function") {
        throw new TypeError("Expected a function");
    }

    const { retries = 3, delay = 500, factor = 2 } = options ?? {};

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            if (attempt === retries) throw error;

            const currentDelay = delay * (factor ** attempt);
            await sleep(currentDelay);
        }
    }
}

function sleep(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

module.exports = retry;