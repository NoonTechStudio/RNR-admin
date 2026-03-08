import { GetLocations } from "../components/Locations";
import Header from "../components/header";

function Locations(){
    return (
        <>
        <div className='min-h-screen bg-white'>
        {/* <Header/> */}
        <GetLocations/>
        </div>
        </>
    )
};
export default Locations;