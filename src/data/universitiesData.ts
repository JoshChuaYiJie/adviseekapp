
export interface University {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  schools: School[];
}

export interface School {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
}

export const universities: University[] = [
  {
    id: "nus",
    name: "National University of Singapore (NUS)",
    description: "NUS is known for its strong emphasis on research and innovation, particularly in science, technology, and medicine.",
    imageSrc: "https://images.unsplash.com/photo-1487958449943-2429e8be8625",
    schools: [
      {
        id: "computing",
        name: "School of Computing",
        description: "The School of Computing is renowned for its cutting-edge programs in computer science and information systems.",
        imageSrc: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
      },
      {
        id: "law",
        name: "School of Law",
        description: "The Faculty of Law is one of Asia's leading law schools, known for its rigorous curriculum and distinguished faculty.",
        imageSrc: "https://images.unsplash.com/photo-1473177104440-ffee2f376098"
      },
      {
        id: "medicine",
        name: "School of Medicine",
        description: "The School of Medicine offers comprehensive medical education and training to prepare future healthcare professionals.",
        imageSrc: "https://images.unsplash.com/photo-1472396961693-142e6e269027"
      }
    ]
  },
  {
    id: "ntu",
    name: "Nanyang Technological University (NTU)",
    description: "NTU is globally recognized for its strengths in engineering and business, as well as its beautiful eco-friendly campus.",
    imageSrc: "https://images.unsplash.com/photo-1496307653780-42ee777d4833",
    schools: [
      {
        id: "computing",
        name: "School of Computer Science and Engineering",
        description: "SCSE offers comprehensive programs in computer science, AI, data science, and more.",
        imageSrc: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6"
      },
      {
        id: "business",
        name: "Nanyang Business School",
        description: "One of Asia's premier business schools, offering world-class business education and innovative programs.",
        imageSrc: "https://images.unsplash.com/photo-1519389950473-47ba0277781c"
      },
      {
        id: "engineering",
        name: "College of Engineering",
        description: "A leading engineering school known for cutting-edge research and comprehensive engineering programs.",
        imageSrc: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7"
      }
    ]
  },
  {
    id: "smu",
    name: "Singapore Management University (SMU)",
    description: "SMU is known for its interactive teaching approach and focus on business, management, and social sciences.",
    imageSrc: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e",
    schools: [
      {
        id: "business",
        name: "Lee Kong Chian School of Business",
        description: "A top-ranked business school known for its innovative curriculum and industry connections.",
        imageSrc: "https://images.unsplash.com/photo-1498050108023-c5249f4df085"
      },
      {
        id: "law",
        name: "School of Law",
        description: "The School of Law offers rigorous legal education with a strong emphasis on practical skills.",
        imageSrc: "https://images.unsplash.com/photo-1459767129954-1b1c1f9b9ace"
      },
      {
        id: "information",
        name: "School of Computing and Information Systems",
        description: "SCIS equips students with technical knowledge and business acumen for the digital economy.",
        imageSrc: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"
      }
    ]
  }
];
