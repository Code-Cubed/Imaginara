
const Artwork = require('../models/Artwork');
const Comment = require('../models/Comment');
const User = require('../models/User');

// Get user's content analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all user's artworks
    const artworks = await Artwork.find({ creator: userId, flagged: false });

    if (artworks.length === 0) {
      return res.json({
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalArtworks: 0,
        avgViewsPerArtwork: 0,
        avgLikesPerArtwork: 0,
        viewsTrend: [],
        likesTrend: [],
        commentsTrend: [],
        topArtworks: [],
        categoryDistribution: [],
        engagementRate: 0
      });
    }

    // Calculate totals
    const totalViews = artworks.reduce((sum, art) => sum + art.views, 0);
    const totalLikes = artworks.reduce((sum, art) => sum + art.likes.length, 0);
    const totalComments = artworks.reduce((sum, art) => sum + art.commentsCount, 0);
    const totalArtworks = artworks.length;

    // Calculate averages
    const avgViewsPerArtwork = Math.round(totalViews / totalArtworks);
    const avgLikesPerArtwork = Math.round(totalLikes / totalArtworks);

    // Get views trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewsTrend = await getViewsTrend(artworks, thirtyDaysAgo);
    const likesTrend = await getLikesTrend(artworks, thirtyDaysAgo);
    const commentsTrend = await getCommentsTrend(artworks, thirtyDaysAgo);

    // Get top 5 performing artworks
    const topArtworks = artworks
      .sort((a, b) => {
        const scoreA = a.views * 1 + a.likes.length * 3 + a.commentsCount * 5;
        const scoreB = b.views * 1 + b.likes.length * 3 + b.commentsCount * 5;
        return scoreB - scoreA;
      })
      .slice(0, 5)
      .map(art => ({
        id: art._id,
        title: art.title,
        views: art.views,
        likes: art.likes.length,
        comments: art.commentsCount,
        thumbnail: art.thumbnailUrl,
        engagementScore: art.views * 1 + art.likes.length * 3 + art.commentsCount * 5
      }));

    // Get category distribution
    const categoryDistribution = getCategoryDistribution(artworks);

    // Calculate engagement rate
    const engagementRate = totalViews > 0 
      ? Math.round(((totalLikes + totalComments) / totalViews) * 100) 
      : 0;

    res.json({
      totalViews,
      totalLikes,
      totalComments,
      totalArtworks,
      avgViewsPerArtwork,
      avgLikesPerArtwork,
      viewsTrend,
      likesTrend,
      commentsTrend,
      topArtworks,
      categoryDistribution,
      engagementRate
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper function to get views trend
const getViewsTrend = async (artworks, startDate) => {
  const trend = [];
  const artworkIds = artworks.map(art => art._id);
  
  // For demo purposes, generate daily data based on current views
  // In production, you'd track this with a ViewLog model
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate daily views (in production, query actual view logs)
    const dailyViews = Math.floor(
      artworks.reduce((sum, art) => sum + art.views, 0) / 30 * (0.5 + Math.random())
    );
    
    trend.push({
      date: date.toISOString().split('T')[0],
      views: dailyViews
    });
  }
  
  return trend;
};

// Helper function to get likes trend
const getLikesTrend = async (artworks, startDate) => {
  const trend = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const dailyLikes = Math.floor(
      artworks.reduce((sum, art) => sum + art.likes.length, 0) / 30 * (0.5 + Math.random())
    );
    
    trend.push({
      date: date.toISOString().split('T')[0],
      likes: dailyLikes
    });
  }
  
  return trend;
};

// Helper function to get comments trend
const getCommentsTrend = async (artworks, startDate) => {
  const trend = [];
  const artworkIds = artworks.map(art => art._id);
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // Get actual comments for this day
    const dailyComments = await Comment.countDocuments({
      artwork: { $in: artworkIds },
      createdAt: {
        $gte: date,
        $lt: nextDate
      }
    });
    
    trend.push({
      date: date.toISOString().split('T')[0],
      comments: dailyComments
    });
  }
  
  return trend;
};

// Helper function to get category distribution
const getCategoryDistribution = (artworks) => {
  const distribution = {};
  
  artworks.forEach(art => {
    const category = art.category || 'Uncategorized';
    if (!distribution[category]) {
      distribution[category] = 0;
    }
    distribution[category]++;
  });
  
  return Object.entries(distribution).map(([category, count]) => ({
    category,
    count,
    percentage: Math.round((count / artworks.length) * 100)
  }));
};

// Get individual artwork analytics
exports.getArtworkAnalytics = async (req, res) => {
  try {
    const { artworkId } = req.params;
    const artwork = await Artwork.findById(artworkId).populate('creator', 'name');

    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if user owns this artwork
    if (artwork.creator._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get comments for this artwork
    const comments = await Comment.find({ artwork: artworkId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate engagement score
    const engagementScore = artwork.views * 1 + artwork.likes.length * 3 + artwork.commentsCount * 5;

    res.json({
      artwork: {
        id: artwork._id,
        title: artwork.title,
        views: artwork.views,
        likes: artwork.likes.length,
        comments: artwork.commentsCount,
        createdAt: artwork.createdAt,
        thumbnail: artwork.thumbnailUrl
      },
      engagementScore,
      recentComments: comments,
      performance: {
        viewsRank: 'Good', // Could calculate actual rank
        likesRank: 'Excellent',
        commentsRank: 'Average'
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};