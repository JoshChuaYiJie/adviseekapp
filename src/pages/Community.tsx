import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Facebook, Instagram, Send, MessageCircle, ArrowLeft } from "lucide-react";
import { CommunitySidebar } from '@/components/community/CommunitySidebar';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

type Post = {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  user_email?: string;
  community?: string;
};

const PLACEHOLDER_POSTS: Post[] = [
  {
    id: '1',
    title: 'Tips for NUS Computer Science Interview',
    content: 'Here are some key tips for the NUS CS interview: 1. Review basic algorithms...',
    user_id: 'system',
    created_at: '2025-04-20T10:00:00Z',
    user_email: 'sarah.tech@example.com',
    community: 'Computer Science'
  },
  {
    id: '2',
    title: 'Engineering Project Showcase 2025',
    content: 'Excited to share my final year project in mechanical engineering...',
    user_id: 'system',
    created_at: '2025-04-19T15:30:00Z',
    user_email: 'engineer.john@example.com',
    community: 'Engineering'
  },
  {
    id: '3',
    title: 'Medical School Application Guide',
    content: 'After going through the application process, here are my insights...',
    user_id: 'system',
    created_at: '2025-04-18T09:15:00Z',
    user_email: 'future.doc@example.com',
    community: 'Medicine'
  }
];

const CommunityPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithEmails = await Promise.all(
        data.map(async (post) => {
          const { data: userData } = await supabase.auth.getUser(post.user_id);
          return { ...post, user_email: userData.user?.email };
        })
      );

      const allPosts = [...postsWithEmails, ...PLACEHOLDER_POSTS];
      setPosts(allPosts);
    } catch (error) {
      toast.error("Failed to fetch community posts");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to create a post");
      return;
    }

    try {
      const { error } = await supabase.from('community_posts').insert({
        title: newPost.title,
        content: newPost.content,
        user_id: user.id
      });

      if (error) throw error;

      toast.success("Post created successfully");
      setNewPost({ title: '', content: '' });
      fetchPosts();
    } catch (error) {
      toast.error("Failed to create post");
      console.error(error);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.community?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen">
      <CommunitySidebar />
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Button>
          </div>

          <div className="mb-6 bg-soft-purple rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">{t('community.join')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t('community.connect')}
            </p>
            <div className="flex justify-center space-x-4">
              <a 
                href="https://t.me/adviseek" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:bg-soft-gray dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
              >
                <Send size={32} className="text-[#2AABEE]" />
              </a>
              <a 
                href="https://discord.gg/adviseek" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:bg-soft-gray dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
              >
                <svg height="32" width="32" viewBox="0 -28.5 256 256" version="1.1" className="fill-[#5865F2]">
                  <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"/>
                </svg>
              </a>
              <a 
                href="https://facebook.com/adviseek" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:bg-soft-gray dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
              >
                <Facebook size={32} className="text-[#1877F2]" />
              </a>
              <a 
                href="https://instagram.com/adviseek" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:bg-soft-gray dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
              >
                <Instagram size={32} className="text-[#E1306C]" />
              </a>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">{t('community.title')}</h1>
            <div className="w-1/3">
              <Input
                placeholder={t('community.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </div>

          <form onSubmit={handleCreatePost} className="mb-8 p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
            <Input
              placeholder={t('community.post_title')}
              value={newPost.title}
              onChange={(e) => setNewPost({...newPost, title: e.target.value})}
              className="mb-4"
              required
            />
            <Textarea
              placeholder={t('community.post_content')}
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
              className="mb-4 min-h-[100px]"
              required
            />
            <Button type="submit" className="w-full">{t('community.create_post')}</Button>
          </form>

          <div className="space-y-4">
            {isLoading ? (
              <p>Loading posts...</p>
            ) : filteredPosts.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">{t('community.no_posts')}</p>
            ) : (
              filteredPosts.map((post) => (
                <div 
                  key={post.id} 
                  className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{post.content}</p>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('community.posted_by')} {post.user_email || 'Anonymous'} 
                    {' '} {t('community.on')} {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
