export interface Pillar {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface ExecutiveLeader {
  name: string;
  role: string;
  motto?: string;
  bio: string;
  imagePath: string;
  signature?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: "lisa-hospital" | "tree-planting" | "team-projects" | "all";
  description: string;
  imagePath: string;
  fallbackIcon: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "author" | "member";
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    fullName: string;
    email: string;
  };
  publishedAt: string;
  image: string;
  category: string;
  tags: string[];
}

