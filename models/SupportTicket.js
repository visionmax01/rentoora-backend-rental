import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
  },
  issueType: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'Open', // Possible values: 'Open', 'In Progress', 'Closed'
  },

},
{
  timestamps: true, // Automatically adds createdAt and updatedAt fields
}
);

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;
