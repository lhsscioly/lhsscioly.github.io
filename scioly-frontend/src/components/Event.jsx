import { useState } from "react";

const Event = (props) => {
  const event = props.event;
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(event.name);
  const [group, setGroup] = useState(event.group);
  const [description, setDescription] = useState(event.description);
  const [resource, setResource] = useState("");
  const [resources, setResources] = useState(event.resources);

  const editEvent = async (e) => {
    e.preventDefault();
    await props.editEvent(event.id, { name, group, description, resources });
    setEdit(false);
  };

  const deleteEvent = async () => {
    await props.deleteEvent(event.id);
  };

  const addResource = () => {
    if (resource.trim()) {
      setResources(resources.concat(resource.trim()));
      setResource("");
    }
  };

  if (edit) {
    return (
      <li className="p-4 bg-white rounded-md shadow-sm border border-orange-200">
        <form onSubmit={editEvent}>
          <div className="flex justify-between items-center">
            <div className="mb-1">
              <input
                value={name}
                onChange={({ target }) => setName(target.value)}
                className="text-lg font-semibold text-orange-700 px-2 py-1 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-orange-600 text-white px-4 py-1 rounded hover:bg-red-700 transition"
              >
                Save
              </button>
              <button
                type="button"
                className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 transition"
                onClick={() => {
                  setEdit(false);
                  setName(event.name);
                  setGroup(event.group);
                  setDescription(event.description);
                  setResource("");
                  setResources(event.resources);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-800 mb-1">
            <label className="font-medium block mb-1">Category:</label>
            <input
              value={group}
              onChange={({ target }) => setGroup(target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="text-sm text-gray-800 mb-3">
            <label className="font-medium block mb-1">Description:</label>
            <textarea
              value={description}
              onChange={({ target }) => setDescription(target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              rows={4}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Resources:</p>
            <div className="flex flex-wrap gap-2">
              {resources.map((r) => (
                <div
                  key={r}
                  className="flex items-center bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded-full shadow hover:bg-orange-200 transition"
                >
                  <a
                    href={r}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate max-w-[140px] hover:underline"
                  >
                    {r}
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      setResources(resources.filter((res) => res !== r))
                    }
                    className="ml-2 text-gray-500 text-lg hover:text-red-600 font-bold"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-3">
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Add Resource
            </label>
            <div className="flex gap-2">
              <input
                value={resource}
                onChange={({ target }) => setResource(target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                onClick={addResource}
                type="button"
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      </li>
    );
  } else {
    return (
      <li className="p-4 bg-white rounded-md shadow-sm border border-orange-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-orange-700 mb-1">
            {event.name}
          </h3>
          {props.user && props.user.admin ? (
            <div className="flex justify-between gap-2">
              <button
                className="bg-orange-600 text-white px-4 py-1 rounded hover:bg-orange-700 transition"
                onClick={() => setEdit(true)}
              >
                Edit
              </button>
              <button
                className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 transition"
                onClick={deleteEvent}
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
        <p className="text-sm text-gray-800 mb-1">
          <span className="font-medium">Category:</span> {event.group}
        </p>
        <p className="text-sm text-gray-800 mb-3">
          <span className="font-medium">Description:</span> {event.description}
        </p>

        {props.user ? (
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Resources:</p>
            <div className="flex flex-wrap gap-2">
              {event.resources.map((r) => (
                <a
                  key={r}
                  href={r}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded-full shadow hover:bg-orange-200 transition"
                >
                  {r}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </li>
    );
  }
};

export default Event;
