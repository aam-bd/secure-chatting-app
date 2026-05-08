// Helper: Modular Exponentiation (base^exp % mod)
function modPow(base, exp, mod) {
    let result = 1n;
    base = base % mod;
    while (exp > 0n) {
        if (exp % 2n === 1n) result = (result * base) % mod;
        exp = exp / 2n;
        base = (base * base) % mod;
    }
    return result;
}

// Helper: Extended Euclidean Algorithm (Finds modular inverse)
function modInverse(a, m) {
    let m0 = m, x0 = 0n, x1 = 1n;
    if (m === 1n) return 0n;
    while (a > 1n) {
        let q = a / m;
        let t = m;
        m = a % m;
        a = t;
        t = x0;
        x0 = x1 - q * x0;
        x1 = t;
    }
    if (x1 < 0n) x1 += m0;
    return x1;
}

class ToyRSA {
    constructor(p, q, e = 65537n) {
        // 1. Compute n
        this.n = p * q;
        
        // 2. Compute Euler's totient function phi(n)
        const phi = (p - 1n) * (q - 1n);
        
        // 3. Public exponent e
        this.e = e;
        
        // 4. Compute Private key d (modular inverse of e mod phi)
        this.d = modInverse(this.e, phi);
    }

    getPublicKey() {
        return { e: this.e, n: this.n };
    }

    getPrivateKey() {
        return { d: this.d, n: this.n };
    }

    // Encryption: c = m^e mod n
    encrypt(messageBigInt) {
        return modPow(messageBigInt, this.e, this.n);
    }

    // Decryption: m = c^d mod n
    decrypt(ciphertextBigInt) {
        return modPow(ciphertextBigInt, this.d, this.n);
    }
}

// Helper functions for string conversion
function stringToBigInt(str) {
    const bytes = Buffer.from(str, 'utf8');
    let hex = '0x';
    for (let byte of bytes) {
        hex += byte.toString(16).padStart(2, '0');
    }
    return BigInt(hex);
}

function bigIntToString(bigInt) {
    let hex = bigInt.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return Buffer.from(bytes).toString('utf8');
}

// Note: In reality, p and q must be massive (e.g., 2048-bit) randomly generated primes.
// This is a toy implementation for demonstration only.
// Using larger primes to support longer messages (up to ~256 bytes)
const p = 94333313318502867046296529386697n;
const q = 22102528329668129503139506347721n;
const rsa = new ToyRSA(p, q, 65537n);

export { rsa, stringToBigInt, bigIntToString };