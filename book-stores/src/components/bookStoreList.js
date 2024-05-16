import React, { Component } from 'react';
import axios from 'axios';
import './bookStoreList.css'

class BookStore extends Component {
    constructor(props) {
        super(props);
        this.state = {
            stores: null,   
        };
    }

    componentDidMount() {
        this.fetchData();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0'); 
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}.${month}.${year}`;
    }

    starRating = (rating) => {
        const filledStars = Math.floor(rating);
        const hasHalfStar = rating - filledStars >= 0.5;

        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= filledStars) {
                stars.push(<span key={i} className="star filled" style={{ color: 'gold' }}>&#9733;</span>);
            } else if (hasHalfStar && i === filledStars + 1) {
                stars.push(<span key={i} className="star half-filled" style={{ color: 'gold' }}>&#9733;</span>);
            } else {
                stars.push(<span key={i} className="star empty" style={{ color: 'grey' }}>&#9733;</span>);
            }
        }
        return <div className="star-rating">{stars}</div>;
    };

    fetchData = async() => {
        try {
            const response = await axios.get('http://localhost:3000/stores');
            const allData = response.data;

            const stores = allData.data.map((storeData) => {
                const store = {
                    id: storeData.id,
                    attributes: storeData.attributes,
                    books: null,
                    country: null
                };

                // Resolve country
                const countryData = allData.included.find(item => item.type === 'countries' && item.id === storeData.relationships.countries.data.id);
                if (countryData) {
                    store.country = {
                        id: countryData.id,
                        code: countryData.attributes.code,
                    };
                }

                // Resolve books
                if (storeData?.relationships && storeData?.relationships?.books) {
                    store.books = [];
                    storeData?.relationships?.books?.data.forEach(bookData => {
                        const matchingBooks = allData.included.filter(item => item.type === 'books' && item.id === bookData.id);
                        matchingBooks.forEach(book => {
                            store.books.push({
                                id: book.id,
                                attributes: book.attributes,
                                author: null 
                            });
                        });
                    });

                    //Resolve authors for each book
                    store.books.forEach(book => {
                        const authorData = allData.included.find(item => item.type === 'authors' && item.id === book.id);
                        if (authorData) {
                            book.author = {
                                id: authorData.id,
                                fullName: authorData.attributes.fullName
                            };
                        }
                    });
                }
                return store;
            }); 
            
            stores.forEach(store => {
                if (store.books && store.books.length > 0) {
                    store.books.sort((a, b) => b.attributes.copiesSold - a.attributes.copiesSold);
                    store.topTwoBooks = store.books.slice(0, 2);

                }
            })
            this.setState({stores: stores})
            console.log("STORES", stores)
            
            

        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    render() {
        const { stores } = this.state;
        console.log("THIS.STATE.STORES", stores);

        if (!stores) return <div>Loading...</div>;

        return (
            <div>
                {stores.map((store, index) => (
                    <div className="store-container">
                        <div key={index}>
                            <div className="store-details">
                                <div className="store-image">
                                    <img
                                        src={store.attributes.storeImage}
                                        alt={`Store ${store.attributes.name}`}
                                        className="store-image"
                                    />
                                </div>
                                <div className= "store-header">
                                    <h1>{store.attributes.name}</h1>                       
                                    {this.starRating(store.attributes.rating)}
                                    {store.topTwoBooks && store.topTwoBooks.length > 0 ? (
                                        <table className="book-table">
                                            <colgroup>
                                                <col className="w-full" />
                                                <col />
                                            </colgroup>
                                            <thead>
                                                <tr>
                                                    <th colSpan="2" className="table-header">Best-selling Books</th>
                                                </tr>
                                                <tr>
                                                    <th scope="col">Book</th>
                                                    <th scope="col">Author</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {store.topTwoBooks.map((book, bookIndex) => (
                                                    <tr key={bookIndex}>
                                                        <td>{book.attributes.name}</td>
                                                        <td>{book?.author?.fullName || 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table className="book-table">
                                        <colgroup>
                                            <col className="w-full" />
                                            <col />
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th colSpan="2" className="table-header">Best-selling Books</th>
                                            </tr>
                                            <tr>
                                                <th scope="col">Book</th>
                                                <th scope="col">Author</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            
                                            <tr>
                                                <td>{'No data available'}</td>
                                                <td>{''}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    )}
                                </div>
                            </div>
                                <div className="store-establishment-date-flag">
                                    <div className='website'>
                                        <p>
                                            {this.formatDate(store.attributes.establishmentDate)} - {' '}
                                            <a href={store.attributes.website}>
                                                {store.attributes.website}
                                            </a>
                                        </p>
                                    </div>
                                    <div className='store-flag'>
                                        <img
                                        src={
                                            `https://flagsapi.com/${store?.country?.code}/flat/64.png`}
                                        alt={`Flag of ${store.country.code}`}
                                        className="store-flag"
                                        />
                                    </div>
                                </div>
                        </div>
                    </div>
                ))}
            </div>
            
        );
    }

}
export default BookStore;
