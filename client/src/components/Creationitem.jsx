import React, { useState } from "react";
import { Button } from "@mui/material";
import Markdown from 'react-markdown'

export const Creationitem = ({ item }) => {
  const [expanded, setexpanded] = useState(false);
  return (
    <div
      className="p-4 max-w-5xl text-sm bg-white border border-light rounded-lg cursor-pointer"
      onClick={() => setexpanded(!expanded)}
    >
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2>{item.prompt}</h2>
          <p className="text-primary">
            {item.type}-{new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button variant="contained" color="info">
          {item.type}
        </Button>
      </div>
      {expanded && (
        <div>
          {item.type === "image" ? (
            <div>
              <img
                src={item.content}
                alt="image"
                className="mt-3 w-full max-w-md"
              />
            </div>
          ) : (
            <div className="mt-3 h-full overflow-y-scroll text-sm text-primary">
              <div className="reset-tw">
                <Markdown>
                  {item.content}
                  </Markdown></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
