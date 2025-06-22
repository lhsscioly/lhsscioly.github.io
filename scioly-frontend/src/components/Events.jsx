import { useState, useEffect } from "react";
import Event from "./Event";
import eventService from "../services/events";
import Modal from "./Modal";

const Events = (props) => {
  const [error, setError] = useState(null)
  const [events, setEvents] = useState([]);
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [description, setDescription] = useState("");
  const [resource, setResource] = useState("");
  const [resources, setResources] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const result = await eventService.getAll();
        setEvents(result);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
    fetchEvents();
  }, []);

  const addResource = () => {
    if (resource.trim()) {
      setResources(resources.concat(resource.trim()));
      setResource("");
    }
  };

  const handleEventAdd = async (event) => {
    event.preventDefault();
    try {
      const newEvent = await eventService.createEvent({
        name,
        group,
        description,
        resources,
      });
      setEvents(events.concat(newEvent));
      setName("");
      setGroup("");
      setDescription("");
      setResource("");
      setResources([]);
      setModalOpen(false);
    } catch (error) {
      if (error.response?.data?.error && error.response.data.error === "expected `event name` to be unique") {
        setError("Event already added");
        setTimeout(() => {
          setError(null)
        }, 5000)
      } else {
        console.error("Failed to add event:", error);
      }
    }
  };

  const editEvent = async (id, eventObject) => {
    try {
      const updatedEvent = await eventService.changeEvent(id, eventObject);
      setEvents(
        events.map((event) =>
          event.id === updatedEvent.id ? updatedEvent : event,
        ),
      );
    } catch (error) {
      console.error("Failed to edit event:", error);
    }
  };

  const deleteEvent = async (id) => {
    try {
      await eventService.deleteEvent(id);
      setEvents(events.filter(e => e.id !== id))
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-16 p-6 bg-white rounded-md shadow-md">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold mb-6 text-center text-orange-800">
          Science Olympiad Events
        </h2>

        {props.user && props.user.admin && (
          <div className="mb-6">
            <button
              onClick={() => setModalOpen(true)}
              className="text-orange-600 text-3xl px-4 py-2 rounded hover:text-orange-700 transition"
            >
              +
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setName("");
          setGroup("");
          setDescription("");
          setResource("");
          setResources([]);
          setModalOpen(false);
        }}
        title="Add New Event"
      >
        {error && (
            <div
              className="mb-4 rounded-md bg-red-100 border border-red-500 text-red-800 px-4 py-3 shadow-md"
              role="alert"
            >
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
        )}
        <form
          onSubmit={handleEventAdd}
          className="space-y-4 bg-orange-50 p-4 rounded-md"
        >
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Name
            </label>
            <input
              value={name}
              onChange={({ target }) => setName(target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Category
            </label>
            <input
              value={group}
              onChange={({ target }) => setGroup(target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={({ target }) => setDescription(target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y min-h-[100px]"
            />
          </div>

          <div>
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

          <div className="mt-4 space-y-2">
            {resources.length > 0 && (
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
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700 transition"
          >
            Add Event
          </button>
        </form>
      </Modal>

      <ul className="space-y-4">
        {events.map((e) => (
          <Event
            user={props.user}
            key={e.id}
            event={e}
            editEvent={editEvent}
            deleteEvent={deleteEvent}
          />
        ))}
      </ul>
    </div>
  );
};

export default Events;
