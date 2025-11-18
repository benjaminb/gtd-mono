const express = require('express');
const router = express.Router();
const invoiceService = require('../services/invoiceService');

// Note: These routes assume authentication middleware is applied at the app level
// and req.user is populated with the authenticated user's information

/**
 * GET /api/invoices
 * List all invoices for the current user
 * Query params: limit (optional, default: 10)
 */
router.get('/', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limit = parseInt(req.query.limit) || 10;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 100',
      });
    }

    const invoices = await invoiceService.getUserInvoices(req.user.userId, limit);
    res.json({ invoices });
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({
      error: 'Failed to retrieve invoices',
      message: error.message,
    });
  }
});

/**
 * GET /api/invoices/upcoming
 * Get the upcoming invoice for the current user
 */
router.get('/upcoming', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const upcomingInvoice = await invoiceService.getUpcomingInvoice(req.user.userId);

    if (!upcomingInvoice) {
      return res.status(404).json({
        error: 'No upcoming invoice found',
        message: 'You do not have any upcoming invoices',
      });
    }

    res.json({ invoice: upcomingInvoice });
  } catch (error) {
    console.error('Error getting upcoming invoice:', error);
    res.status(500).json({
      error: 'Failed to retrieve upcoming invoice',
      message: error.message,
    });
  }
});

/**
 * GET /api/invoices/:id
 * Get a specific invoice by ID
 */
router.get('/:id', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id: invoiceId } = req.params;

    const invoiceData = await invoiceService.getInvoice(invoiceId);

    // Verify that the invoice belongs to the current user
    // This requires checking through the database
    const userInvoices = await invoiceService.getUserInvoices(req.user.userId, 1000);
    const userInvoiceIds = userInvoices.map(inv => inv.invoice.invoiceId);

    if (!userInvoiceIds.includes(invoiceId)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this invoice',
      });
    }

    res.json(invoiceData);
  } catch (error) {
    console.error('Error getting invoice:', error);

    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        error: 'Not found',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to retrieve invoice',
      message: error.message,
    });
  }
});

/**
 * GET /api/invoices/:id/pdf
 * Get PDF URL for a specific invoice
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id: invoiceId } = req.params;

    const invoiceData = await invoiceService.getInvoice(invoiceId);

    // Verify that the invoice belongs to the current user
    const userInvoices = await invoiceService.getUserInvoices(req.user.userId, 1000);
    const userInvoiceIds = userInvoices.map(inv => inv.invoice.invoiceId);

    if (!userInvoiceIds.includes(invoiceId)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this invoice',
      });
    }

    if (!invoiceData.invoice.invoicePdf) {
      return res.status(404).json({
        error: 'PDF not available',
        message: 'This invoice does not have a PDF available',
      });
    }

    // Redirect to Stripe's PDF URL
    res.redirect(invoiceData.invoice.invoicePdf);
  } catch (error) {
    console.error('Error getting invoice PDF:', error);

    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        error: 'Not found',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to retrieve invoice PDF',
      message: error.message,
    });
  }
});

module.exports = router;
