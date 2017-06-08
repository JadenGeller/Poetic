
function assertBool(expected, lambda) {
    try {
        const actual = lambda()(true)(false);
        if (expected != actual) {
            console.log(`assertBool(${expected}, ${lambda})\n -> ValueError: found ${actual}\n`)
        }
    } catch(e) {
        console.log(`assertBool(${expected}, ${lambda})\n -> ${e.toString()}\n`);
    }
}

function assertNat(expected, lambda) {
    try {
        const actual = lambda()(x => x + 1)(0);
        if (expected != actual) {
            console.log(`assertNat(${expected}, ${lambda})\n -> ValueError: found ${actual}\n`)
        }
    } catch(e) {
        console.log(`assertNat(${expected}, ${lambda})\n -> ${e.toString()}\n`);
    }
}

assertBool(true,  () => _true);
assertBool(false, () => _false);

assertBool(true,  () => _intersecting(_true)(_true));
assertBool(false, () => _intersecting(_true)(_false));
assertBool(false, () => _intersecting(_false)(_true));
assertBool(false, () => _intersecting(_false)(_false));
assertBool(true,  () => _intersecting(_intersecting(_true)(_true))
                                     (_intersecting(_true)(_true)));
assertBool(false, () => _intersecting(_intersecting(_true)(_true))
                                     (_intersecting(_true)(_false)));
                                    
assertBool(true,  () => _union(_true)(_true));
assertBool(true,  () => _union(_true)(_false));
assertBool(true,  () => _union(_false)(_true));
assertBool(false, () => _union(_false)(_false));
assertBool(true,  () => _union(_union(false)(false))
                              (_union(false)(true)));
assertBool(true,  () => _union(_union(false)(false))
                              (_union(false)(true)));

assertNat(0, () => _nothing);
assertNat(1, () => _after(_nothing));
assertNat(2, () => _after(_after(_nothing)));
assertNat(3, () => _after(_after(_after(_nothing))));
assertNat(4, () => _after(_after(_after(_after(_nothing)))));

assertNat(1, () => _one);
assertNat(2, () => _after(_one));
assertNat(3, () => _after(_after(_one)));
assertNat(4, () => _after(_after(_after(_one))));
assertNat(5, () => _after(_after(_after(_after(_one)))));

assertNat(0, () => _before(_one));
assertNat(1, () => _before(_after(_one)));
assertNat(1, () => _after(_before(_one)));
assertNat(2, () => _after(_before(_after(_one))));
assertNat(0, () => _before(_before(_after(_one))));
assertNat(0, () => _after(_before(_before(_one))));
assertNat(1, () => _before(_before(_after(_after(_one)))));
assertNat(1@, () => _before(_after(_after(_before(_one)))));
