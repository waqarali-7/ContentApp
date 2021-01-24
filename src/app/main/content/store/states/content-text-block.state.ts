import { environment } from './../../../../../environments/environment';
import { UploadService } from './../../services/upload.service';
import { ContentTextBlock } from '../../models/content-text-blocks';
import { Injectable } from '@angular/core';
import { ContentService } from '../../services/content.service';
import { getContent, getContentImages, updateContent } from '../../store/actions/content.action';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap } from 'rxjs/operators';
import { transformContentData, transformContentImagesData } from '../../transformer/content.transform';


export class ContentTextBlockStateModel {
    contentTextBlocks: ContentTextBlock[];
    totalContentTextBlocks: number;
    updatedBlock: ContentTextBlock;
    contentImages: string[];
    error: string;
}

@State<ContentTextBlockStateModel>({
    name: 'contentTextBlocks',
    defaults: {
        contentTextBlocks: [],
        totalContentTextBlocks: 0,
        updatedBlock: null,
        contentImages: [],
        error: ''
    }
})
@Injectable()
export class ContentTextBlockState {

    constructor(private contentService: ContentService, private uploadService: UploadService) {
    }

    @Selector()
    static getContentTextBlockList(state: ContentTextBlockStateModel) {
        return state.contentTextBlocks;
    }

    @Selector()
    static getTotalContentTextBlock(state: ContentTextBlockStateModel) {
        return state.totalContentTextBlocks;
    }

    @Selector()
    static getContentImages(state: ContentTextBlockStateModel) {
        return state.contentImages;
    }

    @Selector()
    static updateContentBlock(state: ContentTextBlockStateModel) {
        return state.updatedBlock;
    }

    @Selector()
    static errorContentBlock(state: ContentTextBlockStateModel) {
        return state.error;
    }

    @Action(getContent)
    getContent({ getState, setState }: StateContext<ContentTextBlockStateModel>, payload) {
        return this.contentService.getContent(payload.id, payload.params).pipe(tap((result) => {
            const state = getState();
            setState({
                ...state,
                contentTextBlocks: payload.initialRequest ? transformContentData(result.rows) : [...state.contentTextBlocks, ...transformContentData(result.rows)],
                totalContentTextBlocks: result.total
            });
        }));
    }

    @Action(getContentImages)
    getContentImages({ getState, setState }: StateContext<ContentTextBlockStateModel>, payload) {
        return this.contentService.getContentImages(payload.id, payload.textID).pipe(tap((result) => {
            const state = getState();
            setState({
                ...state,
                contentImages: transformContentImagesData(result.rows),
            });
        }));
    }

    @Action(updateContent)
    updateContentBlock({ getState, setState }: StateContext<ContentTextBlockStateModel>, payload) {

        const state = getState();
        if (state.updatedBlock) {
            setState({
                ...state,
                updatedBlock: null
            });
        }

        const data = {
            code: payload.payload.title,
            content: {
                type: 'html',
                value: payload.payload.description
            }
        }

        payload.payload.images.map((file) => {
            this.uploadService.uploadFile(file).then(resultURL => {
                const fileData = {
                    url: resultURL,
                    type: "image",
                    title: file.name
                };
                this.contentService.uploadContentBlockImage(fileData, payload.id).subscribe((result) => {
                    state.contentTextBlocks[payload.selectedIndex].image =
                        state.contentTextBlocks[payload.selectedIndex].image ?
                            state.contentTextBlocks[payload.selectedIndex].image : resultURL;
                    setState({
                        ...state,
                        contentTextBlocks: state.contentTextBlocks,
                        updatedBlock: state.contentTextBlocks[payload.selectedIndex]
                    });
                });

            }, (error) => {
                const state = getState();
                setState({
                    ...state,
                    error: `Error in uploading image ${file.name}`,
                });
            })
        })

        return this.contentService.updateContentBlock(data, payload.id).pipe(tap((result) => {
            state.contentTextBlocks[payload.selectedIndex].description = payload.payload.description;
            state.contentTextBlocks[payload.selectedIndex].title = payload.payload.title;
            setState({
                ...state,
                contentTextBlocks: state.contentTextBlocks,
                updatedBlock: state.contentTextBlocks[payload.selectedIndex]
            });
        }));
    }
}