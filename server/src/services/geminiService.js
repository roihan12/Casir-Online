require('dotenv').config();
const { GoogleGenAI, Type } = require("@google/genai");
const prisma = require("../config/db");
const checkoutService = require("./checkoutService");
const { getCatalogProducts } = require('./catalogService');


// Initialize Gemini SDK
// Note: It will automatically use process.env.GEMINI_API_KEY
let ai;
try {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} catch (err) {
  console.warn("Failed to initialize Google GenAI. GEMINI_API_KEY might be missing.");
}

/**
 * Menganalisis pesan dan merespons sebagai AI CS Bot
 * @param {string} prompt - Pesan dari user
 * @param {object} botConfig - Konfigurasi bot cabang untuk memberikan konteks toko
 * @param {object} session - Sesi database untuk menyimpan history context (opsional)
 */
const generateBotResponse = async (prompt, botConfig, session = null) => {
    if (!ai) {
        return {
            reply: "Sistem AI sedang tidak aktif. Ketik *CS* untuk berbicara dengan admin.",
            newHistory: [],
            hasOrdered: false
        };
    }

    try {
        const storeName = botConfig.name || "Toko Kami";
        const systemInstruction = `Kamu adalah asisten virtual WhatsApp yang ramah dan sopan untuk toko bernama ${storeName}.
Tugasmu adalah:
1. Menyambut pelanggan dengan hangat.
2. Memberikan informasi ketersediaan produk dan harga JIKA DITANYA, dengan selalu memanggil alat (tools) 'search_product' terlebih dahulu untuk mengecek database! Jangan pernah menebak atau berhalusinasi harga/stok. Jika produk kosong atau tidak ada, beritahu pelanggan dengan sopan.
3. Membantu pelanggan melakukan pemesanan. HANYA JIKA pelanggan SUDAH SEPAKAT ingin beli barang A sebanyak X, konfirmasi ulang nama lengkapnya dan pilihan pembayarannya (Transfer/Midtrans atau COD). Jika pelanggan sudah setuju, panggil alat 'checkout_order' untuk nge-submit pesanan. PENTING: Saat memanggil checkout_order, nilai 'produk_id' HARUS menggunakan ID unik (berupa UUID panjang) yang persis dikembalikan dari 'search_product'. DILARANG KERAS menggunakan nama produk atau SKU sebagai produk_id!
4. Jika pelanggan bertanya hal yang sulit atau ingin berbicara dengan manusia, sarankan mereka untuk mengetik "CS" atau "Admin".
5. Pesan katalog panduan default: "${botConfig.catalog_message || 'Tanya admin untuk katalog lengkap'}".
6. Gunakan emoji yang sesuai, dan jaga jawaban agar singkat, padat, dan ramah (bahasa chat WhatsApp).`;

        // If you want chat history context, you can append it from session.sessionData
        const chatContext = session && session.sessionData && session.sessionData.history 
          ? session.sessionData.history 
          : [];

        // Build messages
        let contents = [];
        
        // Push history (User -> Model mapping)
        if (chatContext.length > 0) {
            for (const msg of chatContext) {
                 contents.push({ role: msg.role === 'ai' ? 'model' : 'user', parts: [{ text: msg.text }] });
            }
        }
        
        // Push current prompt
        contents.push({ role: 'user', parts: [{ text: prompt }] });

        // Define Tools
        const tools = [{
            functionDeclarations: [
                {
                    name: "search_product",
                    description: "Mencari ketersediaan produk, harga, dan stok di toko cabang saat ini berdasarkan kata kunci pencarian. Panggil ini saat pengguna menanyakan menu, harga, atau ketersediaan barang. Nilai 'produk_id' yang dikembalikan adalah UUID yang didapat dari search_product, wajib kamu ingat untuk fungsi checkout. jangan menggunakan kamu menggunakan UUID dari produk yang tidak ada di database.",
                    parameters: {
                        type: Type?.OBJECT || "OBJECT",
                        properties: {
                            query: {
                                type: Type?.STRING || "STRING",
                                description: "Kata kunci nama produk yang dicari (contoh: Kopi, Mie, Es)"
                            }
                        },
                        required: ["query"]
                    }
                },
                {
                    name: "checkout_order",
                    description: "Bantu pengguna melakukan memproses order. Panggil HANYA SAAT pelanggan SUDAH deal/sepakat untuk beli barang tertentu dengan jumlah tertentu dan sudah memberikan namanya.",
                    parameters: {
                        type: Type?.OBJECT || "OBJECT",
                        properties: {
                            items: {
                                type: Type?.ARRAY || "ARRAY",
                                description: "Daftar produk yang ingin dipesan",
                                items: {
                                    type: Type?.OBJECT || "OBJECT",
                                    properties: {
                                        produk_id: { type: Type?.STRING || "STRING", description: "WAJIB diisi dengan ID unik produk (berupa format UUID panjang, misal '123e4567-e89b-12d3...') yang didapat SAAT memanggil 'search_product'. DILARANG KERAS mengisi dengan nama produk atau SKU. dan mengarang UUID" },
                                        jumlah: { type: Type?.INTEGER || "INTEGER", description: "Jumlah pesanan untuk item ini (angka)" },
                                        catatan: { type: Type?.STRING || "STRING", description: "Catatan khusus pesanan (misal: ekstra pedas/es dipisah)" }
                                    },
                                    required: ["produk_id", "jumlah"]
                                }
                            },
                            customer_name: {
                                type: Type?.STRING || "STRING",
                                description: "Nama panggilan pelanggan (tanyakan jika belum tahu)"
                            },
                            payment_method: {
                                type: Type?.STRING || "STRING",
                                description: "Metode pembayaran. Nilai yang valid hanya: 'PAYMENT_LINK' (untuk transfer/online) atau 'COD'. Jika tidak disebut, default ke 'PAYMENT_LINK'."
                            }
                        },
                        required: ["items", "customer_name", "payment_method"]
                    }
                }
            ]
        }];

        let response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
                maxOutputTokens: 500,
                tools: tools
            }
        });

        let hasOrdered = false;
        let loopCount = 0;
        
        // Handle function calls loop (max 3 loops to avoid infinite recursion)
        while (response.functionCalls && response.functionCalls.length > 0 && loopCount < 3) {
            const call = response.functionCalls[0];
            const functionName = call.name;
            const args = call.args;
            let funcResult = null;

            console.log("Function call:", functionName, args);

            try {
                if (functionName === 'search_product') {
                    const products = await getCatalogProducts(botConfig.cabang_id, {
                        search: args.query
                    });

                    console.log("Products found:1", products);
                    console.log("Products found:2", products.data);
                    
                    if (products.data.length === 0) {
                        funcResult = { pesan: "Produk tidak ditemukan di cabang ini." };
                    } else {
                        funcResult = products.data.map(p => ({
                            produk_id: p.produk_id,
                            nama: p.nama_produk,
                            harga: Number(p.harga_jual),
                            satuan: p.satuan,
                            stok: p.stok !== null ? p.stok : 'Unlimited'
                        }));
                    }
                } else if (functionName === 'checkout_order') {
                    // Extract customer phone from session
                    const fromPhone = session?.platformUserId || 'unknown';
                    
                    const orderPayload = {
                       cabang_id: botConfig.cabang_id,
                       customer_phone: fromPhone,
                       customer_name: args.customer_name,
                       order_type: 'DELIVERY', // assume default for chat
                       payment_method: args.payment_method === 'COD' ? 'COD' : 'PAYMENT_LINK',
                       items: args.items.map(item => ({
                           produk_id: item.produk_id,
                           jumlah: item.jumlah,
                           catatan: item.catatan || ""
                       }))
                    };
                    
                    // Execute checkoutService
                    const checkoutResult = await checkoutService.createOnlineOrder(orderPayload);
                    
                    funcResult = {
                        sukses: true,
                        order_id: checkoutResult.nomor_transaksi,
                        total_bayar: checkoutResult.total,
                        payment_url: checkoutResult.payment_url || "Bayar di tempat (COD)",
                        pesan: "Beritahu pesanan berhasil dibuat dan berikan payment_url jika ada."
                    };
                    
                    hasOrdered = true;
                    
                    // Also save native BotOrder for backward compatibility / metrics
                    await prisma.botOrder.create({
                        data: {
                            sessionId: session.id,
                            botConfigId: botConfig.bot_config_id,
                            orderStatus: 'pending', // or confirmed if COD
                            orderData: args.items,
                            transaksiId: checkoutResult.transaksi_id
                        }
                    });
                }
            } catch (e) {
                console.error(`Gemini Function [${functionName}] error:`, e);
                funcResult = { sukses: false, error: e.message };
            }

            // Append function call block to history
            contents.push(response.candidates[0].content); 
            // Append function response
            contents.push({
                role: "user",
                parts: [{
                    functionResponse: {
                        name: functionName,
                        response: { result: funcResult }
                    }
                }]
            });

            // Call API again to get final conversational response
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.7,
                    maxOutputTokens: 500,
                    tools: tools
                }
            });

            loopCount++;
        }

        const reply = response.text;
        
        // Return reply and updated history if needed
        return {
            reply,
            newHistory: [
                ...chatContext,
                { role: 'user', text: prompt },
                { role: 'ai', text: reply }
            ].slice(-10), // Keep last 10 messages for context
            hasOrdered
        };
    } catch (error) {
        console.error("Gemini AI Error:", error);
        return {
            reply: "Maaf, sistem AI kami sedang sibuk. Silakan coba beberapa saat lagi atau ketik *CS*.",
            newHistory: [],
            hasOrdered: false
        };
    }
};

/**
 * Mengekstrak JSON pesanan dari pesan user (Order Parser)
 */
/**
 * Mengembalikan data pesanan
 */
const extractOrderData = async (textMessage) => {
     if (!ai) return null;

    try {
        const extractionPrompt = `Tugasmu adalah mengekstrak pesanan pelanggan dari teks chat WhatsApp berikut.
Teks Pelanggan: "${textMessage}"

Kembalikan HANYA format valid JSON array dengan objek berikut:
[
  { "item": "nama barang", "qty": jumlah_angka, "notes": "catatan jika ada atau null" }
]
JANGAN menambah teks markdown, JANGAN menambah penjelasan lain, HANYA JSON. Jika tidak ada pesanan terdeteksi, kembalikan array kosong [].`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: extractionPrompt,
            config: {
                temperature: 0.1, // low temp for rigid extraction
                responseMimeType: 'application/json',
            }
        });

        // Parse JSON
        let rawJson = response.text;
        rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(rawJson);
    } catch (error) {
         console.error("Gemini Extraction Error:", error);
         return null;
    }
}

/**
 * Membuat instruksi sistem untuk Asisten Analitik POS
 */
const buildPosSystemPrompt = (posData) => {
    let dataContext = "Data belum tersedia/Gagal diekstrak.";
    if (posData) {
        // Stringify partial essential pos data to avoid token explosion
        const safeData = {
           salesSummary: posData.salesSummary,
           criticalAlerts: posData.criticalAlerts,
           branchPerformance: posData.branchPerformance,
           productPerformance: posData.productPerformance,
           staffActivity: posData.staffActivity,
        };
        dataContext = JSON.stringify(safeData, (key, value) => {
            if (typeof value === "bigint") return value.toString();
            return value;
        }, 2);
    }

    return `Kamu adalah Asisten Analitik Bisnis bernama 'Casir-Online AI'.
Tugasmu: Menganalisis laporan toko secara realtime dan menjawab pertanyaan pengelola cabang/Owner berdasarkan data POS berikut.

[KONTEKS DATA POS REALTIME HARI INI]
${dataContext}

ATURAN PENTING:
1. Hanya jawab berdasarkan data pada KONTEKS POS di atas. Jika user nanya sesuatu yang di luar data (seperti berita hari ini), tolak dengan sopan bahwa kamu hanya asisten POS.
2. Jelaskan dengan bahasa yang profesional namun rileks (Bisa panggil 'Bapak/Ibu Owner').
3. Tarik kesimpulan yang berguna (misal: "Pendapatan Anda hari ini lebih tinggi 5% dari kemarin, produk paling laris adalah Kopi Susu").
4. Coba berikan satu rekomendasi/action item jika relevan dengan data (contoh restock barang yang mau habis jika data lowStockProducts terdeteksi).
`;
};

/**
 * Asisten Analitik POS - Digunakan di Dashboard
 */
const askPosAssistant = async (question, history = [], posData = null) => {
     if (!ai) throw new Error("Gemini AI belum dikonfigurasi. Cek GEMINI_API_KEY.");

     try {
         const systemInstruction = buildPosSystemPrompt(posData);
         
         let contents = [];
         
         // Attach History up to last 10
         const recentHistory = history.slice(-10);
         for (const msg of recentHistory) {
             contents.push({
                 role: msg.role === 'ai' ? 'model' : 'user',
                 parts: [{ text: msg.content }]
             });
         }
         
         // Attach Question
         contents.push({ role: 'user', parts: [{ text: question }] });

         const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: contents,
             config: {
                 systemInstruction: systemInstruction,
                 temperature: 0.5,
             }
         });

         return response.text;
     } catch (error) {
         console.error("Gemini POS Assistant Error:", error);
         throw error;
     }
}


module.exports = {
    generateBotResponse,
    extractOrderData,
    askPosAssistant
};
