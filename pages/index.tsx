import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { parseCookies } from "nookies";
import { FormEvent, useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { withSSRGuest } from "../src/utils/wisthSSRGuest";

const Home: NextPage = () => {
  const { signIn } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const data = {
      email,
      password,
    };

    await signIn(data);
  }
  return (
    <div>
      <Head>
        <title>Estudo autenticação</title>
      </Head>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button>Enviar</button>
      </form>
    </div>
  );
};

export const getServerSideProps = withSSRGuest(async (ctx) => {
  return {
    props: {},
  };
});

export default Home;
