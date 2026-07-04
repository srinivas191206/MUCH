import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Usage } from '../models/Usage.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Server error fetching user list.' });
  }
});

// Update User Role (Admin only)
router.put('/users/:id/role', verifyToken, verifyAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role assignment.' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Prevent self-demotion
    if (req.params.id === req.userId && role !== 'admin') {
      return res.status(400).json({ error: 'Admins cannot demote themselves.' });
    }

    user.role = role;
    await user.save();
    res.json({ message: 'User role updated successfully.', user: { id: user._id, role: user.role } });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Server error updating user role.' });
  }
});

// Update User Status - Suspend/Activate (Admin only)
router.put('/users/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status assignment.' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Prevent self-suspension
    if (req.params.id === req.userId && status === 'suspended') {
      return res.status(400).json({ error: 'Admins cannot suspend themselves.' });
    }

    user.status = status;
    await user.save();
    res.json({ message: 'User status updated successfully.', user: { id: user._id, status: user.status } });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error updating user status.' });
  }
});

// Delete User Account (Admin only)
router.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    if (req.params.id === req.userId) {
      return res.status(400).json({ error: 'Admins cannot delete their own accounts.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Clean up associated usage logs asynchronously
    Usage.deleteMany({ userId: req.params.id }).catch(err => console.error('Usage cleanup err:', err));

    res.json({ message: 'User account and usage history deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error deleting user account.' });
  }
});

// Get Aggregate Analytics (Admin only)
router.get('/analytics', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // 1. Summary totals
    const totalStats = await Usage.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalPromptChars: { $sum: '$promptChars' },
          totalCompletionChars: { $sum: '$completionChars' }
        }
      }
    ]);

    // 2. Model breakdown
    const modelStats = await Usage.aggregate([
      {
        $group: {
          _id: '$model',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 3. Provider breakdown
    const providerStats = await Usage.aggregate([
      {
        $group: {
          _id: '$provider',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 4. Daily time series (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await Usage.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      summary: totalStats[0] || { totalRequests: 0, totalPromptChars: 0, totalCompletionChars: 0 },
      models: modelStats,
      providers: providerStats,
      daily: dailyStats
    });
  } catch (error) {
    console.error('Analytics aggregation error:', error);
    res.status(500).json({ error: 'Server error aggregating usage analytics.' });
  }
});

export default router;
