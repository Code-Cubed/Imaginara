import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, Heart, MessageCircle, BarChart2, Award } from 'lucide-react';

import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30days');

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/analytics/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch analytics');
      }

      setAnalytics(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
       
        <div className="main-content">
        
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
       
        <div className="main-content">
         
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={fetchAnalytics} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalArtworks === 0) {
    return (
      <div className="page-container">
        
        <div className="main-content">
          
          <div className="empty-analytics">
            <BarChart2 size={64} color="#9ca3af" />
            <h2>No Analytics Yet</h2>
            <p>Upload your first artwork to see insights!</p>
            <button onClick={() => navigate('/addartwork')} className="btn btn-primary">
              Upload Artwork
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
     
      
      <div className="main-content">
       
        
        <div className="analytics-container">
          <div className="analytics-header">
            <div>
              <h1 className="analytics-title">Content Insights</h1>
              <p className="analytics-subtitle">Track your content performance and engagement</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Eye size={24} />
              </div>
              <div className="stat-details">
                <p className="stat-label">Total Views</p>
                <h3 className="stat-value">{analytics.totalViews.toLocaleString()}</h3>
                <p className="stat-change">Avg: {analytics.avgViewsPerArtwork} per artwork</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <Heart size={24} />
              </div>
              <div className="stat-details">
                <p className="stat-label">Total Likes</p>
                <h3 className="stat-value">{analytics.totalLikes.toLocaleString()}</h3>
                <p className="stat-change">Avg: {analytics.avgLikesPerArtwork} per artwork</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <MessageCircle size={24} />
              </div>
              <div className="stat-details">
                <p className="stat-label">Total Comments</p>
                <h3 className="stat-value">{analytics.totalComments.toLocaleString()}</h3>
                <p className="stat-change">Engagement rate: {analytics.engagementRate}%</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                <TrendingUp size={24} />
              </div>
              <div className="stat-details">
                <p className="stat-label">Total Artworks</p>
                <h3 className="stat-value">{analytics.totalArtworks.toLocaleString()}</h3>
                <p className="stat-change">Keep creating!</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-grid">
            {/* Views Trend */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Views Trend (Last 30 Days)</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.viewsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#667eea" strokeWidth={2} dot={{ fill: '#667eea', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Engagement Trend */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Engagement Trend (Last 30 Days)</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.likesTrend.map((item, index) => ({
                  date: item.date,
                  likes: item.likes,
                  comments: analytics.commentsTrend[index]?.comments || 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="likes" stroke="#f093fb" strokeWidth={2} />
                  <Line type="monotone" dataKey="comments" stroke="#4facfe" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Content by Category</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category} (${percentage}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Performing Artworks */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Top Performing Artworks</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topArtworks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="title" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="views" fill="#667eea" />
                  <Bar dataKey="likes" fill="#f093fb" />
                  <Bar dataKey="comments" fill="#4facfe" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Artworks List */}
          <div className="top-artworks-section">
            <h3 className="section-title">
              <Award size={24} />
              Top Performing Content
            </h3>
            <div className="top-artworks-list">
              {analytics.topArtworks.map((artwork, index) => (
                <div 
                  key={artwork.id} 
                  className="top-artwork-item"
                  onClick={() => navigate(`/artwork/${artwork.id}`)}
                >
                  <div className="artwork-rank">#{index + 1}</div>
                  <div className="artwork-thumb">
                    {artwork.thumbnail && <img src={artwork.thumbnail} alt={artwork.title} />}
                  </div>
                  <div className="artwork-details">
                    <h4>{artwork.title}</h4>
                    <div className="artwork-metrics">
                      <span><Eye size={14} /> {artwork.views}</span>
                      <span><Heart size={14} /> {artwork.likes}</span>
                      <span><MessageCircle size={14} /> {artwork.comments}</span>
                    </div>
                  </div>
                  <div className="artwork-score">
                    <span className="score-label">Score</span>
                    <span className="score-value">{artwork.engagementScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;