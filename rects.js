importScripts("helpers.js");

postMessage([
    "sliders",
    defaultControls.concat([{
        label: "Dots Per Black Pixel",
        value: 0.000001,
        min: 0,
        max: 0.0002,
        step: 0.000001,
    }]),
]);

function getLines(getPixel, rect, numDots, dotsPerPx) {
    function getDarkness(x, y) {
        let darkness = getPixel(x, y);
        if (x == Math.floor(rect.left)) {
            darkness *= x + 1 - rect.left;
        } else if (x == Math.ceil(rect.right) - 1) {
            darkness *= rect.right - x;
        }

        if (y == Math.floor(rect.top)) {
            darkness *= y + 1 - rect.top;
        } else if (y == Math.ceil(rect.bottom) - 1) {
            darkness *= rect.bottom - y;
        }

        return darkness;
    }

    if (numDots == 1) {
        return [];
    } else {
        const width = rect.right - rect.left;
        const height = rect.bottom - rect.top;

        // The number of dots we want to be in the first subdivision.
        const targetDots = Math.floor(numDots / 2);

        let dotsSoFar = 0;
        if (width > height) {
            for (let x = Math.floor(rect.left); x < rect.right; x++) {
                let dotsThisColumn = 0;

                for (let y = Math.floor(rect.top); y < rect.bottom; y++) {
                    dotsThisColumn += getDarkness(x, y) * dotsPerPx;
                }

                dotsSoFar += dotsThisColumn;
                if (dotsSoFar >= targetDots) {
                    // The dividing line falls somewhere within this row.
                    // Place it based on how much we overshot.
                    const overshoot = dotsSoFar - targetDots;
                    const overshootProportion = overshoot / dotsThisColumn;
                    const divisionX = x + (1 - overshootProportion);

                    let lines = [[
                        [divisionX, rect.top],
                        [divisionX, rect.bottom],
                    ]];

                    lines = lines.concat(getLines(
                        getPixel,
                        { ...rect, right: divisionX },
                        targetDots,
                        dotsPerPx,
                    ));

                    lines = lines.concat(getLines(
                        getPixel,
                        { ...rect, left: divisionX },
                        numDots - targetDots,
                        dotsPerPx,
                    ));

                    return lines;
                }
            }
        } else {
            for (let y = Math.floor(rect.top); y < rect.bottom; y++) {
                let dotsThisRow = 0;

                for (let x = Math.floor(rect.left); x < rect.right; x++) {
                    dotsThisRow += getDarkness(x, y) * dotsPerPx;
                }

                dotsSoFar += dotsThisRow;
                if (dotsSoFar >= targetDots) {
                    // The dividing line falls somewhere within this row.
                    // Place it based on how much we overshot.
                    const overshoot = dotsSoFar - targetDots;
                    const overshootProportion = overshoot / dotsThisRow;
                    const divisionY = y + (1 - overshootProportion);

                    let lines = [[
                        [rect.left, divisionY],
                        [rect.right, divisionY],
                    ]];

                    lines = lines.concat(getLines(
                        getPixel,
                        { ...rect, bottom: divisionY },
                        targetDots,
                        dotsPerPx,
                    ));

                    lines = lines.concat(getLines(
                        getPixel,
                        { ...rect, top: divisionY },
                        numDots - targetDots,
                        dotsPerPx,
                    ));

                    return lines;
                }
            }
        }
    }
}

onmessage = function (e) {
    const [config, pixData] = e.data;

    // Slider variables
    const dotsPerPx = parseFloat(config["Dots Per Black Pixel"]);

    // Image processor (gets a value for the current pixel)
    const getPixel = pixelProcessor(config, pixData);

    let totalDarkness = 0;
    for (let x = 0; x < config.width; x++) {
        for (let y = 0; y < config.height; y++) {
            totalDarkness += getPixel(x, y);
        }
    }

    // Figure out the integer number of dots we want and adjust the dots per pixel slightly so we get that number,
    const numDots = Math.round(dotsPerPx * totalDarkness);
    const adjustedDotsPerPx = numDots / totalDarkness;

    const lines = getLines(
        getPixel,
        {
            left: 0,
            top: 0,
            right: config.width,
            bottom: config.height,
        },
        numDots,
        adjustedDotsPerPx,
    );
    postLines(
        lines,
    );
};
