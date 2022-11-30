import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { API, Storage } from 'aws-amplify';
import { useRouter } from 'next/router';
import { v4 as uuid } from 'uuid';
import { getPost } from '../../src/graphql/queries';
import { updatePost } from '../../src/graphql/mutations';
const SimpleMdeEditor = dynamic(() => import('react-simplemde-editor'), {
  ssr: false,
});
import 'easymde/dist/easymde.min.css';

function EditPost() {
  const [post, setPost] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [localImage, setLocalImage] = useState(null);
  const fileInput = useRef();
  const router = useRouter();
  const { id } = router.query;
  console.log(id);

  useEffect(() => {
    fetchPost();
    async function fetchPost() {
      if (!id) return;
      try {
        const postData = await API.graphql({
          query: getPost,
          variables: { id },
          authMode: 'AMAZON_COGNITO_USER_POOLS',
        });

        console.log(postData);

        setPost(postData.data.getPost);
        if (postData.data.getPost.coverImage) {
          updateCoverImage(postData.data.getPost.coverImage);
        }
      } catch (e) {
        console.log(e);
      }
    }
  }, [id]);

  if (!post) return null;

  async function updateCoverImage(coverImage) {
    const imageKey = await Storage.get(coverImage);
    setCoverImage(imageKey);
  }

  async function uploadImage() {
    fileInput.current.click();
  }

  function handleChange(e) {
    const fileUpload = e.target.files[0];
    if (!fileUpload) return;
    setCoverImage(fileUpload);
    setLocalImage(URL.createObjectURL(fileUpload));
  }

  function onChange(e) {
    setPost(() => ({ ...post, [e.target.name]: e.target.value }));
  }

  const { title, content } = post;

  async function updateCurrentPost() {
    if (!title || !content) return;

    const postUpdated = { id, content, title };

    if (coverImage && localImage) {
      const fileName = `${coverImage.name}_${uuid()}`;
      postUpdated.coverImage = fileName;
      await Storage.put(fileName, coverImage);
    }

    await API.graphql({
      query: updatePost,
      variables: { input: postUpdated },
      authMode: 'AMAZON_COGNITO_USER_POOLS',
    });

    router.push('/my-posts');
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-wide mt-6 mb-2">
        Edit Post
      </h1>
      {coverImage && (
        <img
          className="mt-4"
          src={localImage ? localImage : coverImage}
          alt=""
        />
      )}
      <input
        type="text"
        name="title"
        placeholder="name"
        onChange={onChange}
        value={post.title}
        className="border-b pb-2 text-lg my-4 focus:outline-none w-full font-light text-gray-500 placeholder-gray-500 y-2"
      />
      <SimpleMdeEditor
        value={post.content}
        onChange={(value) => setPost({ ...post, content: value })}
      />

      <input
        type="file"
        ref={fileInput}
        className="absolute w-0 h-0"
        onChange={handleChange}
        name=""
        id=""
      />
      <button
        className="mb-4 bg-blue-600 text-white font-semibold px-8 py-2 rounded-lg"
        onClick={updateCurrentPost}
      >
        Update Post
      </button>
      <button
        className="mb-4 bg-purple-600 text-white font-semibold px-8 py-2 rounded-lg"
        onClick={uploadImage}
      >
        Upload Cover Image
      </button>
    </div>
  );
}

export default EditPost;
