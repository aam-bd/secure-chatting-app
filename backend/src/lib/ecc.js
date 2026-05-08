// Helper for ECC modular arithmetic (handles negative numbers correctly in JS)
function mod(n, p) {
    return ((n % p) + p) % p;
}

// ECC requires modular inverse for division
function eccModInverse(a, m) {
    let [m0, x0, x1] = [m, 0n, 1n];
    a = mod(a, m);
    while (a > 1n) {
        let q = a / m;
        let t = m;
        m = a % m;
        a = t;
        t = x0;
        x0 = x1 - q * x0;
        x1 = t;
    }
    return x1 < 0n ? x1 + m0 : x1;
}

class EllipticCurve {
    constructor(a, b, p) {
        this.a = a; // Curve parameter 'a'
        this.b = b; // Curve parameter 'b'
        this.p = p; // Prime modulus
    }

    // Point addition: R = P + Q
    addPoints(P, Q) {
        if (!P) return Q; // P is point at infinity
        if (!Q) return P; // Q is point at infinity

        if (P.x === Q.x && mod(P.y + Q.y, this.p) === 0n) {
            return null; // Point at infinity (P + (-P) = 0)
        }

        let lambda;
        if (P.x === Q.x && P.y === Q.y) {
            // Point doubling: P == Q
            // lambda = (3 * x^2 + a) / (2 * y) mod p
            const numerator = mod(3n * P.x * P.x + this.a, this.p);
            const denominator = eccModInverse(mod(2n * P.y, this.p), this.p);
            lambda = mod(numerator * denominator, this.p);
        } else {
            // Point addition: P != Q
            // lambda = (y2 - y1) / (x2 - x1) mod p
            const numerator = mod(Q.y - P.y, this.p);
            const denominator = eccModInverse(mod(Q.x - P.x, this.p), this.p);
            lambda = mod(numerator * denominator, this.p);
        }

        // x3 = lambda^2 - x1 - x2 mod p
        const x3 = mod(lambda * lambda - P.x - Q.x, this.p);
        // y3 = lambda * (x1 - x3) - y1 mod p
        const y3 = mod(lambda * (P.x - x3) - P.y, this.p);

        return { x: x3, y: y3 };
    }

    // Scalar Multiplication: R = k * P (Double-and-Add Algorithm)
    scalarMultiply(k, P) {
        let R = null; // Point at infinity
        let Q = { x: P.x, y: P.y };
        let tempK = k;

        while (tempK > 0n) {
            if (tempK % 2n === 1n) {
                R = this.addPoints(R, Q);
            }
            Q = this.addPoints(Q, Q);
            tempK /= 2n;
        }
        return R;
    }
}

// Initialize toy curve for demo: y^2 = x^3 + 2x + 2 mod 17
const curve = new EllipticCurve(2n, 2n, 17n);
const G = { x: 5n, y: 1n }; // Base point (Generator)

// Generate a key pair (private key is a random BigInt, public key is a point)
function generateKeyPair() {
    // In production, use a secure random number for private key (1 to n-1 where n is order)
    // For this toy example, we use a small random number
    const privateKey = BigInt(Math.floor(Math.random() * 1000000007) % 16 + 1); // Random from 1-16
    const publicKey = curve.scalarMultiply(privateKey, G);
    return { privateKey, publicKey };
}

// Compute shared secret using ECDH
function computeSharedSecret(privateKey, otherPublicKey) {
    return curve.scalarMultiply(privateKey, otherPublicKey);
}

// Encrypt message using shared secret
function encryptMessage(text, sharedSecretPoint) {
    if (!sharedSecretPoint) throw new Error("Invalid shared secret");
    const key = Number(sharedSecretPoint.x);
    
    let encryptedArray = [];
    for (let i = 0; i < text.length; i++) {
        encryptedArray.push(text.charCodeAt(i) ^ key);
    }
    return encryptedArray;
}

// Decrypt message using shared secret
function decryptMessage(encryptedArray, sharedSecretPoint) {
    if (!sharedSecretPoint) throw new Error("Invalid shared secret");
    const key = Number(sharedSecretPoint.x);
    
    let decryptedText = "";
    for (let i = 0; i < encryptedArray.length; i++) {
        decryptedText += String.fromCharCode(encryptedArray[i] ^ key);
    }
    return decryptedText;
}

// Helper to convert point to string for storage
function pointToString(point) {
    if (!point) return null;
    return `${point.x.toString()},${point.y.toString()}`;
}

// Helper to convert string back to point
function stringToPoint(str) {
    if (!str) return null;
    const [x, y] = str.split(",");
    return { x: BigInt(x), y: BigInt(y) };
}

export {
    curve,
    G,
    generateKeyPair,
    computeSharedSecret,
    encryptMessage,
    decryptMessage,
    pointToString,
    stringToPoint,
};
