import { MessageComment } from "./comment";
import { LikedBy } from "./userlikes";

export interface Message {
    _id: string;
    date: string;
    hour: string;
    createdBy: LikedBy;
    body: string;
    likes: number;
    likedBy: number[];
    hashtags: string[];
    comments: MessageComment[];
    images: { url: string; title: string };
    sharedBy?: number[];
}
