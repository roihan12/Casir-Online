import { z } from "zod";

// Schema for OCR extracted product item in the invoice
export const ocrProductItemSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
  subtotal: z.number().nonnegative("Subtotal cannot be negative").optional(),
  confidence: z.number().min(0).max(1).optional(), // OCR confidence score
});

// Schema for the entire OCR extracted invoice
export const invoiceOcrSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  supplierInfo: z.object({
    name: z.string().min(1, "Supplier name is required"),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    taxId: z.string().optional(),
  }),
  items: z
    .array(ocrProductItemSchema)
    .min(1, "At least one product is required"),
  totalAmount: z.number().positive("Total amount must be greater than 0"),
  tax: z.number().nonnegative("Tax cannot be negative").optional(),
  discount: z.number().nonnegative("Discount cannot be negative").optional(),
  notes: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(), // Overall OCR confidence score
});

// Schema for validated invoice data ready for purchase creation
export const validatedInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.date({
    required_error: "Invoice date is required",
    invalid_type_error: "Invoice date must be a valid date",
  }),
  supplierId: z.string().min(1, "Supplier ID is required"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z.number().positive("Quantity must be greater than 0"),
        unitPrice: z.number().nonnegative("Unit price cannot be negative"),
        subtotal: z.number().nonnegative("Subtotal cannot be negative"),
        notes: z.string().optional(),
      })
    )
    .min(1, "At least one product is required"),
  totalAmount: z.number().positive("Total amount must be greater than 0"),
  tax: z.number().nonnegative("Tax cannot be negative").optional().default(0),
  discount: z
    .number()
    .nonnegative("Discount cannot be negative")
    .optional()
    .default(0),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CREDIT", "OTHER"]),
  paymentStatus: z.enum(["PAID", "PARTIAL", "UNPAID"]),
  paidAmount: z.number().nonnegative("Paid amount cannot be negative"),
  notes: z.string().optional(),
});
