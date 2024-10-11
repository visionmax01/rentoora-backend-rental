import SupportTicket from '../models/SupportTicket.js';
import moment from 'moment'; // For time comparisons

// Function to generate a unique ticket number
const generateTicketNumber = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase(); // Generate an 8-digit unique ticket number
};

// Create a new support ticket
export const createSupportTicket = async (req, res) => {
  try {
    const { issueType, message } = req.body;
    const userId = req.userId;

    // Validate request
    if (!issueType || !message) {
      return res.status(400).json({ message: 'Please fill out all fields.' });
    }

    // Get the current time and check for tickets created in the last 24 hours
    const now = moment();
    const past24Hours = moment().subtract(24, 'hours');

    // Find tickets created by the user in the last 24 hours
    const recentTickets = await SupportTicket.find({
      clientId: userId,
      createdAt: { $gte: past24Hours.toDate() },
    });

    if (recentTickets.length >= 2) {
      return res.status(400).json({ message: 'limit reached. Please try  after 24 hours.' });
    }

    // Generate a unique ticket number
    const ticketNumber = generateTicketNumber();

    const newTicket = new SupportTicket({
      clientId: userId,
      ticketNumber,
      issueType,
      message,
      status: 'Open', // Default status
    });

    await newTicket.save();
    res.status(201).json({ message: 'Ticket created successfully', ticket: newTicket });
  } catch (error) {
    console.error('Error creating ticket:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};



export const getClientTickets = async (req, res) => {
  try {
    const userId = req.userId; // Ensure this is set correctly
    const tickets = await SupportTicket.find({ clientId: userId });
    res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};





export const updateSupportTicket = async (req, res) => {
  try {
    const { issueType, message, status } = req.body;
    const userId = req.userId;
    const ticketId = req.params.id;

    // Find the ticket
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check authorization
    if (ticket.clientId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    // Update fields if present
    ticket.issueType = issueType || ticket.issueType;
    ticket.message = message || ticket.message;
    ticket.status = status || ticket.status; // Status can be 'Open', 'Closed', etc.

    // Save the updated ticket
    await ticket.save();

    res.status(200).json({ message: 'Ticket updated successfully', ticket });
  } catch (error) {
    console.error('Error updating ticket:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};



export const deleteSupportTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const userId = req.userId;

    // Find the ticket
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check authorization
    if (ticket.clientId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    // Delete the ticket
    await SupportTicket.deleteOne({ _id: ticketId });

    return res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

