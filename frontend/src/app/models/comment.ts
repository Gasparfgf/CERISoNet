import { LikedBy } from "./userlikes";

export interface MessageComment {
    _id: string;
    text: string;
    commentedBy: LikedBy;
    date: string;
    hour: string;
}
