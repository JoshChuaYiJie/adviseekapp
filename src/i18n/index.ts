
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en';
import zhTranslation from './locales/zh';
import msTranslation from './locales/ms';
import taTranslation from './locales/ta';

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          ...enTranslation,
          community: {
            title: 'Community',
            join: 'Join the Adviseek Community',
            connect: 'Connect with other students and share your experiences',
            search: 'Search discussions',
            post_title: 'Post title',
            post_content: 'Share your thoughts...',
            create_post: 'Create Post',
            posted_by: 'Posted by',
            on: 'on',
            no_posts: 'No posts found',
            join_discussions: 'Join discussions with other students',
            back_to_dashboard: 'Back to Dashboard',
            loading: 'Loading posts...',
            error: {
              fetch: 'Failed to fetch community posts',
              auth: 'You must be logged in to create a post',
              post_creation: 'Failed to create post',
              empty_fields: 'Title and content cannot be empty'
            },
            success: {
              post_created: 'Post created successfully'
            },
            submitting: 'Creating...'
          },
          pricing: {
            title: 'Choose your Adviseek plan',
            subtitle: 'Pick the plan that fits your ambitions. Clear pricing, no surprises.',
            most_popular: 'Most Popular',
            contact_us: 'Contact us',
            plan_name: {
              free: 'Free',
              pro: 'Pro',
              enterprise: 'Enterprise'
            },
            features: {
              free: [
                'Unlimited university & course exploration',
                'Basic AI recommendations',
                'View 3 tailored course paths',
                'Resume builder access (basic)',
                'Limited mentorship chat',
                'Community forums access',
              ],
              pro: [
                'Full AI-powered guidance',
                'Unlimited course recommendations',
                'Personalised university essay feedback',
                'Priority mentorship chat',
                'Advanced resume templates & editing',
                'Early access to new tools',
                'Priority support',
              ],
              enterprise: [
                'Custom onboarding for schools/teams',
                'White-label solutions',
                'Bulk seat discounts',
                'Advanced analytics',
                'Dedicated account manager',
                'Custom integrations',
              ]
            },
            cta: {
              free: 'Current Plan',
              pro: 'Upgrade to Pro',
              enterprise: 'Contact Sales'
            }
          },
          common: {
            back_to_dashboard: 'Back to Dashboard'
          },
          footer: {
            privacy: 'Privacy',
            terms: 'Terms',
            help: 'Help'
          },
          apply: {
            select_header: 'Select University and Programme',
            university: 'University',
            programme: 'Programme',
            select_university: 'Select University',
            select_programme: 'Select Programme',
            questions_header: 'Application Questions',
            response_placeholder: 'Type your response here...',
            save_responses: 'Save Responses',
            responses_saved: 'Your responses have been saved!',
            questions: {
              interest: 'Why are you interested in this programme?',
              challenge: 'Describe a challenge you\'ve overcome that demonstrates your suitability for this field.',
              goals: 'What are your career goals and how will this programme help you achieve them?'
            }
          },
          interview: {
            select_application: 'Select Application',
            select_option: 'Select an application',
            potential_questions: 'Potential Interview Questions',
            response_placeholder: 'Type your response here...',
            save_responses: 'Save Responses',
            responses_saved: 'Your responses have been saved!',
            questions: {
              programming: 'Tell me about your experience with programming languages.',
              teamwork: 'How do you approach problem-solving in a team environment?',
              motivation: 'What motivated you to apply for this programme?',
              challenge: 'Describe a challenging project you\'ve worked on and how you overcame obstacles.'
            }
          },
          universities: {
            nus: 'National University of Singapore',
            ntu: 'Nanyang Technological University',
            smu: 'Singapore Management University',
            national_university_of_singapore: 'National University of Singapore',
            nanyang_technological_university: 'Nanyang Technological University',
            singapore_management_university: 'Singapore Management University'
          },
          programmes: {
            computer_science: 'Computer Science',
            business_administration: 'Business Administration',
            medicine: 'Medicine',
            engineering: 'Engineering',
            communication_studies: 'Communication Studies',
            biological_sciences: 'Biological Sciences',
            business: 'Business',
            law: 'Law',
            information_systems: 'Information Systems'
          }
        }
      },
      zh: {
        translation: {
          ...zhTranslation,
          community: {
            title: '社区',
            join: '加入Adviseek社区',
            connect: '与其他学生联系并分享您的经验',
            search: '搜索讨论',
            post_title: '帖子标题',
            post_content: '分享您的想法...',
            create_post: '创建帖子',
            posted_by: '发布者',
            on: '于',
            no_posts: '未找到帖子',
            join_discussions: '加入与其他学生的讨论',
            back_to_dashboard: '返回仪表板',
            loading: '正在加载帖子...',
            error: {
              fetch: '获取社区帖子失败',
              auth: '您必须登录才能创建帖子',
              post_creation: '创建帖子失败',
              empty_fields: '标题和内容不能为空'
            },
            success: {
              post_created: '帖子创建成功'
            },
            submitting: '创建中...'
          },
          pricing: {
            title: '选择您的Adviseek计划',
            subtitle: '选择适合您抱负的计划。明确的定价，没有意外。',
            most_popular: '最受欢迎',
            contact_us: '联系我们',
            plan_name: {
              free: '免费',
              pro: '专业版',
              enterprise: '企业版'
            }
          },
          common: {
            back_to_dashboard: '返回仪表板'
          },
          footer: {
            privacy: '隐私',
            terms: '条款',
            help: '帮助'
          }
        }
      },
      ms: {
        translation: {
          ...msTranslation,
          community: {
            title: 'Komuniti',
            join: 'Sertai Komuniti Adviseek',
            connect: 'Berhubung dengan pelajar lain dan kongsi pengalaman anda',
            search: 'Cari perbincangan',
            post_title: 'Tajuk pos',
            post_content: 'Kongsi pemikiran anda...',
            create_post: 'Cipta Pos',
            posted_by: 'Dipos oleh',
            on: 'pada',
            no_posts: 'Tiada pos dijumpai',
            join_discussions: 'Sertai perbincangan dengan pelajar lain',
            back_to_dashboard: 'Kembali ke Papan Pemuka',
            loading: 'Memuatkan pos...',
            submitting: 'Mencipta...'
          },
          pricing: {
            title: 'Pilih pelan Adviseek anda',
            subtitle: 'Pilih pelan yang sesuai dengan aspirasi anda. Harga yang jelas, tiada kejutan.',
            most_popular: 'Paling Popular',
            contact_us: 'Hubungi Kami'
          },
          common: {
            back_to_dashboard: 'Kembali ke Papan Pemuka'
          },
          footer: {
            privacy: 'Privasi',
            terms: 'Terma',
            help: 'Bantuan'
          }
        }
      },
      ta: {
        translation: {
          ...taTranslation,
          community: {
            title: 'சமூகம்',
            join: 'Adviseek சமூகத்தில் இணையுங்கள்',
            connect: 'மற்ற மாணவர்களுடன் தொடர்பு கொண்டு உங்கள் அனுபவங்களைப் பகிரவும்',
            search: 'விவாதங்களைத் தேடுங்கள்',
            post_title: 'இடுகையின் தலைப்பு',
            post_content: 'உங்கள் எண்ணங்களைப் பகிரவும்...',
            create_post: 'இடுகையை உருவாக்கு',
            posted_by: 'இடுகையிட்டவர்',
            on: 'அன்று',
            no_posts: 'இடுகைகள் எதுவும் கிடைக்கவில்லை',
            join_discussions: 'மற்ற மாணவர்களுடன் விவாதங்களில் இணையுங்கள்',
            back_to_dashboard: 'டாஷ்போர்டுக்குத் திரும்பு',
            loading: 'இடுகைகளை ஏற்றுகிறது...',
            submitting: 'உருவாக்குகிறது...'
          },
          pricing: {
            title: 'உங்கள் Adviseek திட்டத்தைத் தேர்ந்தெடுங்கள்',
            subtitle: 'உங்கள் ஆர்வத்திற்கேற்ற திட்டத்தைத் தேர்ந்தெடுங்கள். தெளிவான விலை, எந்த ஆச்சரியமும் இல்லை.',
            most_popular: 'மிகவும் பிரபலமானது',
            contact_us: 'எங்களை தொடர்பு கொள்ள'
          },
          common: {
            back_to_dashboard: 'டாஷ்போர்டுக்குத் திரும்பு'
          },
          footer: {
            privacy: 'தனியுரிமை',
            terms: 'விதிமுறைகள்',
            help: 'உதவி'
          }
        }
      }
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false // React already handles escaping
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
