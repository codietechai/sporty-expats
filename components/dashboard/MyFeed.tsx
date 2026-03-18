import {
  GET_ALL_POSTS,
  getAllPosts,
} from "@/client/endpoints/posts/getAllPosts";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useInfiniteQuery, useQuery } from "react-query";
import { timeAgo } from "@/helpers/date";
import { likePost } from "@/client/endpoints/posts/likePost";
import { GET_USER_BY_ID, getUserById } from "@/client/endpoints/users/getUserById";

interface Post {
  _id: string;
  desc: string;
  files: any[];
  vote: number;
  title: string;
  total_comments: number;
  author: {
    firstName: string;
    lastName: string;
    imageUrl: string;
  };
  createdAt: string;
  isLikedByUser: boolean;
}

const MyFeed = () => {
  const [postOptions, setPostOptions] = useState<Post[]>([]);

  const { data, refetch } = useQuery([GET_ALL_POSTS], () => getAllPosts(), {
    keepPreviousData: false,
    refetchOnWindowFocus: true,
    retry: 0,
  });

  const { data:user } = useQuery([GET_USER_BY_ID], () => getUserById(), {
    keepPreviousData: false,
    refetchOnWindowFocus: true,
    retry: 0,
  });

  console.log(user)

  

  // console.log(JSON.stringify(data?.data?.data,null,2))

  useEffect(() => {
    if (data) {
      const postValues: Post[] = [];

      data?.data?.data.forEach((post: any) => {
        postValues.push({
          _id: post.id,
          desc: post.description,
          title: post.title,
          author: post.author,
          files: post.files,
          vote: post.count.likes || 0,
          total_comments: post.count.comments,
          createdAt: post.createdAt,
          isLikedByUser: post.isLikedByUser,
        });
      });

      setPostOptions(postValues);
    }
  }, [data]);

  const likePostFunction = async (id: string) => {
   await likePost(id);
  };
  return (
    <ScrollView>
      {postOptions?.map((post) => (
        <View key={post._id} style={{ marginBottom: 20 }}>
          {/* User Info */}
          <View style={styles.flewRow}>
            <View style={styles.flewRow}>
              <Image
                source={{
                  uri:
                    post.author.imageUrl ||
                    "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3407.jpg",
                }}
                width={50}
                height={50}
                style={{ borderRadius: 100 }}
              />
              <View style={{ paddingLeft: 5 }}>
                <Text style={{ color: "white" }}>
                  {post.author.firstName} {post.author.lastName}
                </Text>
                <Text style={{ color: "gray" }}>{timeAgo(post.createdAt)}</Text>
              </View>
            </View>

            <Svg
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="white"
              width={24}
              height={24}
            >
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
              />
            </Svg>
          </View>

          <Text style={{ color: "gray", paddingTop: 8 }}>{post.desc}</Text>

          {post.files && post.files.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12 }}
            >
              {post.files.map(
                (fileUrl: any, id: React.Key | null | undefined) => {
                  // Check if URL starts with "http" or "https" to ensure it's valid
                  const validUrl =
                    fileUrl &&
                    typeof fileUrl.fileUrl === "string" &&
                    (fileUrl.fileUrl.startsWith("http") ||
                      fileUrl.fileUrl.startsWith("https"));
                  return validUrl ? (
                    <Image
                      key={id}
                      // source={{ uri: fileUrl.fileUrl }}
                      source={{
                        uri: "https://cdn.pixabay.com/photo/2018/08/04/11/30/draw-3583548_1280.png",
                      }}
                      style={styles.sliderImage}
                    />
                  ) : (
                    <Image
                      key={id}
                      source={{ uri: fileUrl.fileUrl }}
                      style={styles.sliderImage}
                    />
                  );
                }
              )}
            </ScrollView>
          )}

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 10,
              marginTop: 50,
            }}
          >
            <TouchableOpacity
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 2,
                alignItems: "center",
              }}
              onPress={() => likePostFunction(post._id)}
            >
              <Svg
                // style={{ marginLeft: 14 }}
                fill={post.isLikedByUser ? "red" : "none"}
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke={post.isLikedByUser ? "red" : "white"}
                width={24}
                height={24}
              >
                <Path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                />
              </Svg>
              <Text style={{ color: "white" }}>{post.vote} </Text>
            </TouchableOpacity>

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 2,
                alignItems: "center",
              }}
            >
              <Svg
                // style={{ marginLeft: 14 }}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="white"
                width={24}
                height={24}
              >
                <Path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                />
              </Svg>

              <Text style={{ color: "white" }}>{post.total_comments}</Text>
            </View>

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 2,
                alignItems: "center",
              }}
            >
              <Svg
                // style={{ marginLeft: 14 }}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="white"
                width={24}
                height={24}
              >
                <Path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
                />
              </Svg>

              <Text style={{ color: "white" }}>{post.vote} </Text>
            </View>
          </View>
          <View>
            <Text >add</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderImage: {
    width: 340,
    height: 250,
    borderRadius: 10,
    marginRight: 10,
  },
});

export default MyFeed;
